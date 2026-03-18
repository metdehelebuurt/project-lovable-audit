

## Plan: Datasheet-controle bij offerte aanmaken

### Wat wordt gebouwd

Bij het aanmaken van een offerte wordt gecontroleerd of elk gekoppeld product een datasheet heeft (`datasheet_url` / `datasheet_type`). Als er producten zonder datasheet zijn, toont een dialog met drie opties per product:

1. **Uploaden** — Fabrikant-datasheet PDF uploaden (direct vanuit de dialog)
2. **Genereren** — Doorsturen naar productpagina om AI-datasheet te genereren
3. **Doorgaan zonder** — Expliciet overslaan

### Wijzigingen

**`src/pages/OfferteNieuw.tsx`**
- In `handleSubmit`, na validatie van klantgegevens/regels: check welke regels een `product_id` hebben, en of dat product `datasheet_type` heeft
- Als er producten zonder datasheet zijn → toon een `DatasheetCheckDialog` in plaats van direct opslaan
- Als alle producten ok of gebruiker kiest "doorgaan" → `saveMutation.mutate()`

**`src/components/offertes/DatasheetCheckDialog.tsx`** (nieuw)
- Dialog met lijst van producten zonder datasheet
- Per product: productnaam + drie knoppen:
  - "Upload PDF" — file input, upload naar `product-images/datasheets/{id}.pdf`, update `producten` record
  - "Genereren" — opent `/producten` met hash/anchor naar dat product (of navigeert)
  - "Overslaan" — markeert product als bewust overgeslagen
- "Doorgaan" knop wordt actief zodra alle producten een keuze hebben (upload/overslaan)
- Na "Doorgaan" → callback die `saveMutation.mutate()` triggert

### Bestanden

| Bestand | Actie |
|---------|-------|
| `src/components/offertes/DatasheetCheckDialog.tsx` | **Nieuw** |
| `src/pages/OfferteNieuw.tsx` | Submit-flow aanpassen met datasheet-check |

Geen database-wijzigingen nodig — de `producten` tabel heeft al `datasheet_url` en `datasheet_type` kolommen.

