

# Plan — Offerte → Verkoopfactuur: betrouwbare conversie + professionele factuurmodule

## Wat er nu misgaat (analyse `FactuurNieuw.tsx` r.140-176 + DB)

| # | Probleem | Gevolg |
|---|---|---|
| 1 | **Klantkoppeling matcht alleen op `klant_email`** via een losse query — bij geen email of typo blijft klantveld leeg | Factuur zonder klant → handmatig zoeken |
| 2 | **`offerte.lead_id` wordt genegeerd** — is vaak betrouwbaarder dan email-match | Klant wordt niet gevonden terwijl hij wel bestaat |
| 3 | **Adres/postcode/plaats van de offerte (`klant_adres`, `klant_postcode`, `klant_plaats`) worden niet meegenomen** als fallback | Eenmalige relatie blijft leeg → PDF mist adres |
| 4 | **`product_id` ontbreekt in de mapping van regels** (alleen omschrijving wordt gekopieerd) | Geen koppeling met product, datasheets/garantie verloren |
| 5 | **`korting_totaal` wordt niet uit de offerte overgenomen** als losse waarde — alleen herberekend uit regels. Werkt toevallig, maar **offerte-niveau-korting** bestaat niet en zou hier verloren gaan | Onverwachte verschillen bij opfrissingen |
| 6 | **`betalingsvoorwaarden` van offerte wordt genegeerd** — staat altijd op default 30 dgn | Conflict met afgesproken voorwaarden in offerte |
| 7 | **`introductie_tekst` / `notities` van offerte verloren** — alleen "Factuur bij offerte X" wordt gezet | Klant ziet generieke factuur ipv afgesproken context |
| 8 | **Geen koppeling naar `opdracht_id`** ondanks dat kolom bestaat | Factuur niet zichtbaar op opdracht-detail |
| 9 | **Geen waarschuwing bij dubbele facturatie** — kan 2x factuur maken voor dezelfde offerte | Risico dubbele administratie |
| 10 | **Geen automatische installatie-koppeling** terwijl de offerte vaak al een installatie heeft | Pakbon/factuur staan los |
| 11 | **`bedrijfsnaam` van klant wordt nooit als fallback gevuld bij eenmalige relatie** als klant niet matcht | Verlies van zakelijke gegevens |
| 12 | **Race condition**: state-set van `klantId` gebeurt async ná `setPrefilled(true)` waardoor latere effects denken dat alles klaar is | Soms toch leeg klantveld |
| 13 | **Geen visuele bevestiging** van waaruit de factuur gegenereerd is — geen "Vanuit offerte OF-…"-badge in de UI | Gebruiker weet niet zeker dat conversie goed ging |
| 14 | **Geen automatische deelfacturatie** (aanbetaling/restant) — vaak gebruikt patroon (30% bij opdracht, 70% na oplevering) | Beperkt professioneel gebruik |

## Oplossing

### A. Robuuste klant-resolutie (FactuurNieuw, useEffect r.140-176 herschrijven)

Nieuwe resolutievolgorde — eerste hit wint:
1. **`offerte.lead_id` → `leads` → `klant_id` koppeling** (via `leads.klant_id` of converter)
2. **Email-match op `klanten.email` of `klanten.extra_emails`** binnen partner_id
3. **Naam + postcode-fuzzy match** (laatste vangnet)
4. **Geen match → automatisch `eenmalige relatie` invullen** uit `klant_naam/adres/postcode/plaats/telefoon/email` van offerte. Toggle "Eenmalige relatie" wordt automatisch aangezet, alle velden voorgevuld. Gebruiker ziet meteen wat er overgenomen is en kan optioneel "→ Klant aanmaken"-knop klikken.

### B. Volledige veld-overname (alle relevante data)

| Offerte-veld | → Factuurveld |
|---|---|
| `regels[]` (volledig, incl. `product_id`, `offerte_tekst`, alle korting-velden) | `regels[]` |
| `betalingsvoorwaarden` (parse: "30 dagen netto" → 30) | `betalingstermijn_dagen` |
| `introductie_tekst` / `notities` | `notities` (samengevoegd met header "Bij offerte OF-…") |
| `lead_id` → `opdrachten.offerte_id` lookup | `opdracht_id` (auto-koppel als opdracht bestaat) |
| `installaties.offerte_id` lookup | `installatie_id` (auto-koppel) |
| `share_token` / `offertenummer` | meegenomen in notities-header en als badge in UI |

### C. UX-verbeteringen FactuurNieuw

1. **"Vanuit offerte"-context-card** bovenaan (vergelijkbaar met `TicketContextCard`):
   - Badge "📄 Gemaakt vanuit offerte OF-251231-0001"
   - Toon klantnaam + totaalbedrag offerte
   - Knop "→ Open offerte" en "↻ Opnieuw synchroniseren"
2. **"Eenmalige relatie automatisch ingevuld"-info-banner** bij fallback met knop "→ Maak klant aan in CRM"
3. **Dubbel-facturatie-waarschuwing**: bij laden offerte-id check op bestaande `financiele_documenten WHERE offerte_id = X AND type='verkoopfactuur'`. Zo ja → waarschuwing + knop "→ Bekijk bestaande factuur" (gebruiker kan alsnog doorgaan voor bv. termijn-factuur).
4. **Termijn-factuur-modus**: keuze "Volledig bedrag" / "Aanbetaling % " / "Restant na eerdere termijnen". Bij keuze "Aanbetaling 30%" → regels worden vervangen door 1 regel `"Aanbetaling 30% offerte OF-…"` met juist berekend bedrag.
5. **Status-update offerte**: na succesvol aanmaken factuur → set `offerte.status` op `gefactureerd` (nieuw) of houd `geaccepteerd` + voeg notitie toe. **Klein DB-schema-vraag**: nieuwe enum-waarde of een veld `gefactureerd_op timestamp`. → Voorstel: kolom `gefactureerd_op` op `offertes` (geen enum-uitbreiding nodig).
6. **Snelknop op opdracht-detail**: "Factuur aanmaken" naast bestaande knoppen, met automatische koppeling `opdracht_id` + voorvulling uit gekoppelde offerte.

### D. Conversie-helper centraliseren

Nieuw bestand `src/lib/factuurFromOfferte.ts` — pure functie:
```ts
export async function buildFactuurFromOfferte(offerteId, partnerId): Promise<{
  klantId?: string; eenmalig?: EenmaligData;
  regels: OfferteRegel[]; betalingstermijn: number;
  notities: string; opdrachtId?: string; installatieId?: string;
  bestaandeFacturen: Array<{id,nummer,totaal}>;
}>
```
Hergebruikt vanuit `FactuurNieuw`, `OpdrachtDetail`, en eventueel "Bulk facturen genereren"-toekomstige flow.

### E. DB-aanpassingen (1 migratie)

```sql
ALTER TABLE offertes ADD COLUMN gefactureerd_op timestamptz;
ALTER TABLE offertes ADD COLUMN gefactureerd_bedrag numeric DEFAULT 0;
CREATE INDEX idx_offertes_gefactureerd ON offertes(gefactureerd_op) WHERE gefactureerd_op IS NOT NULL;
```
Trigger: bij INSERT van `financiele_documenten` met `offerte_id` + `type='verkoopfactuur'` + `status != 'concept'` → update `offertes.gefactureerd_op = now()` en sommeer `gefactureerd_bedrag`.

### F. Polish/professioneel

1. **Notities-veld krijgt rich-text-mode** (consistent met `RichTextEditor`-patroon zoals offertes)
2. **Default-betalingsvoorwaarden uit partner-instellingen** (al aanwezig: `betalingsvoorwaarden_config`) ipv hardcoded 30
3. **Vervaldatum-preview** zichtbaar naast betalingstermijn-dropdown
4. **Klantnaam fallback display**: PDF-rendering blokkeert nu als noch klant noch eenmalig — voeg fallback toe naar offerte-klantgegevens
5. **Edit-modus hint**: bij reeds verzonden factuur waarschuwing "Wijzigingen kunnen niet teruggedraaid worden bij verzonden facturen"

## Bestanden

| Bestand | Actie |
|---|---|
| `src/lib/factuurFromOfferte.ts` | **Nieuw** — centrale converter |
| `src/components/financieel/FactuurContextCard.tsx` | **Nieuw** — bron-context UI |
| `src/components/financieel/TermijnFactuurDialog.tsx` | **Nieuw** — aanbetaling/restant flow |
| `src/pages/FactuurNieuw.tsx` | Refactor: gebruik converter, context-card, dubbel-check, voeg termijn-modus toe |
| `src/pages/OpdrachtDetail.tsx` | Knop "Factuur aanmaken" met `?offerte=…&opdracht=…` |
| `src/pages/OfferteDetail.tsx` | Toon gekoppelde facturen + "Termijn-factuur"-knop wanneer al gefactureerd |
| `supabase/migrations/…_offerte_factuur_link.sql` | Kolommen + trigger |

## Niet wijzigen

- `DocumentRegelEditor` (werkt correct)
- `FactuurDetail` (rendert al alles, krijgt vanzelf juiste data)
- PDF-rendering (`FinancieelPDF`)

## Resultaat

- Klik "Factuur aanmaken" op offerte → klant + adres + regels + betalingstermijn + notities + opdracht/installatie gekoppeld in 1 klik, zichtbaar bevestigd via context-card
- Geen lege velden meer bij ontbrekende email-match
- Termijn-factuur (aanbetaling/restant) als ingebouwde optie
- Dubbele factuur onmogelijk zonder bewust akkoord
- Offerte krijgt zichtbare status "Gefactureerd"

