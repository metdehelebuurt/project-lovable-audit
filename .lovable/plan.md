

# Plan — Professionele voorschot-/deelfacturen (boekhoudkundig kloppend)

## A. Wat ontbreekt nu (analyse)

| # | Probleem | Boekhoudkundig gevolg |
|---|---|---|
| 1 | "Aanbetaling" en "Restant" zijn alleen UI-labels — er is geen apart documenttype | Niet zichtbaar in administratie dat het een voorschotfactuur is |
| 2 | PDF toont "FACTUUR" voor alle voorschotten — geen vermelding "VOORSCHOTFACTUUR" of termijnnummer (1 van 3) | Voldoet niet aan transparantie-eis Art. 35 Wet OB |
| 3 | Restantfactuur verrekent eerdere voorschotten **niet** zichtbaar — het neemt alleen het openstaand bedrag, zonder de ontvangen voorschotten als negatieve regel te tonen | Klant en accountant zien niet hoe het totaal is opgebouwd; BTW-correctie ontbreekt |
| 4 | BTW wordt op heel het voorschot berekend, maar het gewogen gemiddelde-tarief is een aanname — bij gemengde tarieven (21% + 0% verlegd) klopt dit niet | Onjuiste BTW-aangifte |
| 5 | Geen koppeling tussen voorschotten onderling: termijnschema (bijv. 30/40/30) bestaat niet als eenheid | Geen overzicht "termijn 2 van 3" |
| 6 | Bij conversie naar restant worden voorschotten niet automatisch teruggehaald als "reeds betaalde aanbetaling" regels | Dubbele facturatie of foute eindfactuur |
| 7 | E-mail/PDF-bestandsnaam onderscheidt voorschot niet van eindfactuur | Verwarring bij klant en boekhouding |
| 8 | Geen waarschuwing als som van voorschotten > offertetotaal | Risico op overfacturatie |

## B. Wat een voorschotfactuur boekhoudkundig MOET hebben (NL/EU)

1. **Duidelijk type**: vermelding "Voorschotfactuur" of "Termijnfactuur N van M" in de PDF-header (geen wettelijke verplichting maar gangbaar/professioneel)
2. **Verwijzing naar onderliggende offerte/opdracht**: offertenummer + omschrijving (verplicht voor BTW-aftrek bij ontvanger)
3. **BTW correct toegerekend**: voorschotbedrag wordt behandeld als belastbaar feit op factuurmoment (Art. 13 lid 2 Wet OB) — BTW per tarief gegroepeerd
4. **Eindafrekening verrekent voorschotten**: alle eerder ontvangen voorschotten worden als negatieve regel "Reeds gefactureerde voorschotten (factuur VF-2024-001)" met bijbehorende negatieve BTW opgenomen, zodat het netto te betalen bedrag = totaal − reeds gefactureerd
5. **Termijnschema zichtbaar**: PDF toont "Termijn 1 van 3 (30%) — bedrag €X" + status van overige termijnen
6. **Documentnummer-prefix herkenbaar**: bv. `VS-2024-0001` voor voorschot, `VF-2024-0001` voor reguliere/eindfactuur
7. **Cumulatief overzicht**: laatste eindfactuur toont "Reeds betaald via voorschotten: €X" en "Nog te betalen: €Y"

## C. Oplossing — implementatie

### 1. Database

```sql
-- Nieuwe document-subtype-veld (geen breaking change)
ALTER TABLE financiele_documenten
  ADD COLUMN factuur_subtype text
    CHECK (factuur_subtype IN ('regulier','voorschot','eindafrekening')) DEFAULT 'regulier';

ALTER TABLE financiele_documenten
  ADD COLUMN termijn_volgnummer integer,         -- 1, 2, 3 ...
  ADD COLUMN termijn_totaal integer,             -- 3 (van 3)
  ADD COLUMN termijn_percentage numeric,         -- 30.00
  ADD COLUMN voorschot_van_facturen uuid[];      -- bij eindafrekening: id's van verrekende voorschotten

CREATE INDEX idx_fd_subtype_offerte ON financiele_documenten(offerte_id, factuur_subtype);

-- Termijnschema per offerte (optioneel — voor "wizard 30/40/30")
CREATE TABLE offerte_termijnschema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid NOT NULL REFERENCES offertes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  volgnummer integer NOT NULL,
  omschrijving text NOT NULL,           -- "Bij opdracht", "Na schouw", "Na oplevering"
  percentage numeric NOT NULL,
  trigger_status text,                  -- 'opdracht_bevestigd' | 'installatie_gepland' | 'opgeleverd'
  factuur_id uuid REFERENCES financiele_documenten(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE offerte_termijnschema ENABLE ROW LEVEL SECURITY;
-- partner-scope policy gelijk aan andere offerte-tabellen
```

Update nummering-functie zodat voorschotten een eigen reeks krijgen:
```sql
-- in generate_financieel_documentnummer: bij subtype='voorschot' prefix 'VS-'
```

### 2. Centrale logica — uitbreiden `factuurFromOfferte.ts`

- `buildTermijnRegels` krijgt nieuwe modus `eindafrekening` die:
  - Alle reguliere offerte-regels meeneemt
  - **Per BTW-tarief** een verrekenregel toevoegt: `Reeds gefactureerd voorschot 21% (VS-2025-0001, VS-2025-0002) — €−1.500,00`
  - Resultaat: netto te betalen = totaal offerte − som voorschotten, BTW correct per tarief
- Nieuwe helper `buildVoorschotRegel(percentage, btwGroep)` die per BTW-tarief een aparte regel maakt i.p.v. één gewogen gemiddelde
- Nieuwe helper `getTermijnContext(offerteId)` retourneert volgnummer + totaal voor display

### 3. UI-aanpassingen

**`TermijnFactuurDialog.tsx`** uitbreiden:
- 4 modi: Volledig / Voorschot (vast %) / Voorschot (vast bedrag) / **Eindafrekening (verrekent voorschotten)**
- Bij "Voorschot" optie: kies omschrijving ("Aanbetaling bij opdracht", "Bij start installatie", custom)
- Termijn-teller: "Dit wordt termijn 2 van 3" auto-detectie
- Live preview: per BTW-tarief de splitsing (21%: €X / 0%: €Y)
- Waarschuwing als som > offertetotaal

**Nieuwe sectie "Termijnschema" op `OfferteDetail`**:
- Wizard "Maak termijnschema": templates 30/70, 30/40/30, 50/50, custom
- Per termijn: status (open/gefactureerd/betaald) + knop "Maak factuur voor deze termijn"
- Voortgangsbalk

**`FactuurNieuw.tsx`**: bij offerte met termijnschema → automatisch volgende open termijn voorstellen.

### 4. PDF-aanpassingen `FinancieelPDF.tsx`

- Header: bij `factuur_subtype='voorschot'` → label **"VOORSCHOTFACTUUR"** + onder documentnummer "Termijn N van M (X%)"
- Bij `eindafrekening` → label **"EINDAFREKENING"** + verrekenblok onder regels-tabel:
  ```
  Totaal werkzaamheden:        € 10.000,00
  − Voorschot 1 (VS-2025-0001): € − 3.000,00
  − Voorschot 2 (VS-2025-0002): € − 4.000,00
  ────────────────────────────────────────
  Nog te betalen:              €  3.000,00
  ```
- Cumulatief BTW-overzicht: ook negatieve BTW van verrekende voorschotten apart tonen
- Voettekst per voorschot: "Dit is een voorschotfactuur. De definitieve afrekening volgt na oplevering."

### 5. E-mail aanpassingen

- `FactuurEmailDialog.tsx`: type-label `"Voorschotfactuur"` / `"Eindafrekening"` in onderwerp en standaard body
- Bestandsnaam: `Voorschotfactuur-VS-2025-0001-Klantnaam.pdf`
- Edge function `send-factuur-email`: TYPE_LABELS uitbreiden + onderwerp afhankelijk van subtype

### 6. Status- en koppelingenlogica

- Bestaande trigger `sync_offerte_facturatie_status` blijft werken (telt alle verkoopfacturen op)
- Aanvulling: bij eindafrekening met `voorschot_van_facturen` set → controleer dat alle gerefereerde voorschotten bestaan en **status ≠ concept** voor verzending mogelijk is
- Bij `OfferteDetail` toon termijnvoortgang met badges per termijn

## D. 3 nieuwe onderscheidende functies

### 1. **Termijnschema-wizard met smart-templates per branche**
Bij aanmaken offerte (en achteraf op offerte-detail) een wizard met vooraf-ingestelde schema's per producttype:
- **Zonnepanelen**: 30% bij opdracht / 70% na oplevering
- **Warmtepomp**: 30/40/30 (opdracht / start / oplevering)
- **Thuisbatterij**: 50/50 (opdracht / installatie)
- **Custom**: vrij configureerbaar
Schema wordt opgeslagen in `offerte_termijnschema`, gekoppeld aan opdracht-statussen, en geeft op de opdracht-detailpagina een knop "Termijn X factureren" zodra de status-trigger bereikt is.

### 2. **Auto-trigger voorschotfacturen op opdracht-status**
Optionele instelling per termijn: `trigger_status = 'opdracht_bevestigd' | 'installatie_gepland' | 'opgeleverd'`. Wanneer de gekoppelde opdracht/installatie naar die status gaat, krijgt de backoffice een notificatie met "Termijn 2 van 3 is klaar om te factureren — €X" inclusief 1-klik-knop "Factuur aanmaken & verzenden". Voorkomt vergeten voorschotten en versnelt cashflow.

### 3. **Voorschot-dashboard widget op `Financieel`**
Nieuwe kaart "Openstaande termijnen" die toont:
- Aantal opdrachten met openstaande voorschotten
- Totaal te factureren € (uitgesplitst per termijntrigger)
- Top 5 oudste openstaande termijnen met "Direct factureren"-knop
- Cashflow-prognose: "De komende 30 dagen verwacht: €X aan voorschotten"

Geeft directeuren/backoffice direct grip op de termijnpipeline en voorkomt cashflow-gaten.

## E. Bestanden

| Bestand | Actie |
|---|---|
| `supabase/migrations/…_voorschot_facturen.sql` | **Nieuw** — kolommen + termijnschema-tabel + RLS + nummering-update |
| `src/lib/factuurFromOfferte.ts` | Uitbreiden: `buildTermijnRegels` met `eindafrekening`-modus + per-BTW splitsing |
| `src/lib/termijnschema.ts` | **Nieuw** — templates, CRUD-helpers |
| `src/components/financieel/TermijnFactuurDialog.tsx` | 4 modi + termijn-teller + waarschuwingen |
| `src/components/financieel/FinancieelPDF.tsx` | Voorschotlabel, termijnregel, verrekenblok eindafrekening |
| `src/components/financieel/FactuurContextCard.tsx` | Toon termijnschema-voortgang |
| `src/components/financieel/TermijnschemaWizard.tsx` | **Nieuw** — wizard met branche-templates |
| `src/components/financieel/TermijnschemaCard.tsx` | **Nieuw** — voortgang op offerte/opdracht-detail |
| `src/components/financieel/VoorschotDashboardWidget.tsx` | **Nieuw** — widget op Financieel-overzicht |
| `src/pages/FactuurNieuw.tsx` | Subtype + volgnummer-velden meesturen, eindafrekening-flow |
| `src/pages/FactuurDetail.tsx` | Subtype-badge + voorschot-context tonen |
| `src/pages/OfferteDetail.tsx` | Termijnschema-sectie + "Genereer factuur voor termijn N" |
| `src/pages/OpdrachtDetail.tsx` | Auto-trigger meldingen voor openstaande termijnen |
| `src/pages/Financieel.tsx` | Voorschot-dashboard widget |
| `src/components/financieel/FactuurEmailDialog.tsx` | Onderwerp/bestandsnaam per subtype |
| `supabase/functions/send-factuur-email/index.ts` | TYPE_LABELS uitbreiden met voorschot/eindafrekening |

## F. Niet wijzigen

- Bestaande nummering voor `verkoopfactuur` / `creditnota` blijft werken (nieuwe prefix alleen voor voorschot)
- `sync_offerte_facturatie_status` trigger (werkt al correct, telt totaal op)
- `DocumentRegelEditor` (gebruikt zelfde regels-structuur)

## G. Resultaat

- Volledig boekhoudkundig kloppende voorschot- en eindafrekeningfacturen met juiste BTW per tarief
- PDF en e-mail tonen direct dat het een voorschot is + welk termijn van welk totaal
- Eindafrekening verrekent automatisch alle voorgaande voorschotten met negatieve regels
- Termijnschema-wizard maakt aanmaken in 30 seconden mogelijk
- Auto-triggers + dashboard zorgen dat geen termijn meer vergeten wordt → directe cashflow-impact

