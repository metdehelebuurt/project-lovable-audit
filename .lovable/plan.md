

# Plan: Juridische Compliance Check & Fix — Financiële PDF's

## Bevindingen

Na analyse van `FinancieelPDF.tsx` en `OrderbevestigingPDF.tsx` tegen Nederlandse fiscale/handelsrecht vereisten (Belastingdienst factuurvereisten, Handelsregisterwet Art. 23-27):

### FinancieelPDF.tsx — Ontbrekende vereisten

| # | Vereiste | Status | Wettelijke basis |
|---|----------|--------|------------------|
| 1 | **BTW-specificatie per tarief** (uitsplitsing als meerdere tarieven) | ❌ Ontbreekt | Art. 35a Wet OB |
| 2 | **Leveringsdatum** (als afwijkend van factuurdatum) | ❌ Ontbreekt | Art. 35a lid 1f Wet OB |
| 3 | **BTW-nummer klant** (B2B, verplicht bij intracommunautaire levering) | ❌ Ontbreekt | Art. 35a Wet OB |
| 4 | **KvK-nummer klant** (indien bekend) | ❌ Ontbreekt | Handelsregisterwet |
| 5 | **"BTW verlegd"** vermelding bij 0% regels | ❌ Ontbreekt | Art. 37d Wet OB |
| 6 | **Eenheidsprijzen excl. BTW** label verduidelijking | ⚠️ Impliciet | Best practice |
| 7 | **Subtotaal per BTW-tarief** | ❌ Ontbreekt | Art. 35a Wet OB |
| 8 | **Creditnota: verwijzing naar originele factuur** | ❌ Ontbreekt | Art. 35b Wet OB |
| 9 | **Inkooporder: bestelnummer/referentie** prominent | ⚠️ Zwak | Best practice |

### OrderbevestigingPDF.tsx — Ontbrekende vereisten

| # | Vereiste | Status |
|---|----------|--------|
| 1 | **Documentnummer/referentie** | ❌ Ontbreekt |
| 2 | **IBAN/betalingsgegevens** | ❌ Ontbreekt |
| 3 | **KvK-nummer** in header | ❌ Alleen in footer |
| 4 | **Betalingsvoorwaarden/termijn** | ❌ Ontbreekt |
| 5 | **Leveringsdatum/geschatte levertijd** | ❌ Ontbreekt |
| 6 | **BTW-specificatie per tarief** | ❌ Ontbreekt — toont alleen totaal |
| 7 | **IBAN** in footer | ❌ Ontbreekt |

## Implementatie

### 1. FinancieelPDF.tsx — Uitbreiden

**BTW-uitsplitsing per tarief**: Groepeer regels op `btw_percentage`, toon subtotaal + BTW per groep:
```text
Subtotaal 21%:   € 1.200,00    BTW 21%:  € 252,00
Subtotaal  9%:   €   300,00    BTW  9%:  €  27,00
```

**Leveringsdatum**: Nieuw veld in de meta-tabel (optioneel). Prop `leveringsdatum?: string` toevoegen.

**Klant BTW/KvK**: Tonen in het relatie-blok als beschikbaar uit de klant-data.

**"BTW verlegd"**: Bij regels met 0% btw de tekst "BTW verlegd" tonen.

**Creditnota referentie**: Nieuw optioneel prop `referentie_documentnummer` tonen onder documentnummer.

**Inkooporder**: Bestelnummer prominenter weergeven, leverancier KvK/BTW tonen.

### 2. OrderbevestigingPDF.tsx — Uitbreiden

- **Ordernummer**: Tonen (uit `opdracht.id` of nieuw genummerd veld)
- **IBAN + betalingsgegevens**: Sectie toevoegen vóór footer
- **KvK/BTW in header**: Verplaatsen naar zichtbare positie
- **Betalingstermijn**: Tonen in ordergegevens-blok
- **BTW per tarief**: Zelfde uitsplitsing als FinancieelPDF
- **IBAN in footer**: Toevoegen

### 3. FactuurDetail.tsx — Props doorvoeren

Extra data (klant BTW/KvK, leveringsdatum, referentienummer) ophalen en doorgeven aan `FinancieelPDF`.

### Bestanden

| Bestand | Wijziging |
|---|---|
| `src/components/financieel/FinancieelPDF.tsx` | BTW-uitsplitsing, leveringsdatum, klant BTW/KvK, verlegd-label, creditnota referentie |
| `src/components/OrderbevestigingPDF.tsx` | Ordernummer, IBAN, betalingstermijn, BTW-uitsplitsing, KvK in header |
| `src/pages/FactuurDetail.tsx` | Extra props doorgeven |
| `src/pages/FactuurNieuw.tsx` | Leveringsdatum veld toevoegen aan formulier |

### Geen database wijzigingen nodig
De benodigde velden (KvK, BTW-nummer klant, IBAN) zitten al in de bestaande tabellen.

