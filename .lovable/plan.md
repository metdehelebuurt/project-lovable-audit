

## Plan: Productdatasheet Generator & Upload

### Wat wordt gebouwd

Een functie waarmee partners per product een professionele datasheet kunnen genereren in eigen huisstijl, of een fabrikant-datasheet kunnen uploaden. Het is of/of: eigen generatie of fabrikant-upload. Deze datasheets worden vervolgens beschikbaar in de offerte PDF.

### Database migratie

Twee nieuwe nullable kolommen op `producten`:
- `datasheet_url` (text) — URL naar geüploade fabrikant-datasheet (PDF in storage)
- `datasheet_type` (text) — `'fabrikant'` of `'gegenereerd'`, bepaalt welke variant actief is

### Storage

Nieuwe RLS policy op bestaande `product-images` bucket om ook PDF-bestanden te ondersteunen (datasheets worden opgeslagen als `datasheets/{product_id}.pdf`).

### Edge Function: `ai-verify-product-specs`

Nieuwe edge function die productdata (naam, merk, model, specs, certificeringen) stuurt naar Lovable AI (gemini-3-flash-preview) om:
- Specificaties te verifiëren op correctheid/volledigheid
- Ontbrekende specs te suggereren
- Retourneert een JSON met `verified: boolean`, `suggestions: string[]`, `corrected_specs: Record<string,string>`

### Datasheet Preview Component (`src/components/producten/ProductDatasheet.tsx`)

Een CSS print-optimized component dat een professionele datasheet rendert:
- **Header**: Partner logo + naam + primaire kleur accent
- **Producttitel**: Naam, merk, model, categorie badge
- **Productafbeelding**: Groot, links of midden
- **Technische specificaties**: Grid/tabel van alle specs
- **Kenmerken**: Omschrijving, certificeringen, garantie
- **Footer**: Partner contactinfo, website, KvK/BTW

Styling: CSS `@media print` met `page-break` regels, partner branding kleuren dynamisch.

### UI in Producten pagina

Uitbreiding van het productformulier met een nieuwe sectie "Datasheet":
- **Toggle**: "Fabrikant datasheet uploaden" vs "Datasheet genereren"
- Bij **uploaden**: File input voor PDF, opslag in `product-images` bucket
- Bij **genereren**: 
  - "AI Verificatie" knop die specs verifieert via edge function
  - "Preview" knop die de datasheet component in een dialog toont
  - "PDF downloaden" knop (window.print op de preview)
- Indicatie welk type actief is (badge)

### Integratie in Offerte PDF

In `OffertePDFPreview.tsx` op de productpagina:
- Als een product een `datasheet_url` (fabrikant) heeft: link/vermelding tonen
- Als `datasheet_type === 'gegenereerd'`: de datasheet inline renderen als extra pagina na de productinfo

### Route

Nieuwe route `/producten/:id/datasheet` voor standalone datasheet preview/print (vergelijkbaar met `/offertes/:id/pdf`).

### Bestanden

| Bestand | Actie |
|---------|-------|
| DB migratie | `datasheet_url`, `datasheet_type` kolommen |
| `supabase/functions/ai-verify-product-specs/index.ts` | Nieuw — AI specs verificatie |
| `supabase/config.toml` | Function registreren |
| `src/components/producten/ProductDatasheet.tsx` | Nieuw — Datasheet render component |
| `src/pages/ProductDatasheetPage.tsx` | Nieuw — Standalone route wrapper |
| `src/pages/Producten.tsx` | Datasheet sectie in formulier |
| `src/components/OffertePDFPreview.tsx` | Datasheet integratie op productpagina |
| `src/App.tsx` | Route toevoegen |
| `src/integrations/supabase/types.ts` | Auto-update na migratie |

