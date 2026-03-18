

## Plan: Fabrikant-datasheets opnemen in offerte-PDF

### Probleem
De `OffertePDFPreview.tsx` haalt producten op inclusief `datasheet_url` en `datasheet_type`, maar er is geen sectie die datasheets daadwerkelijk toont in de offerte-PDF. Geüploade fabrikant-PDFs worden dus genegeerd.

### Oplossing
Na de productpagina (page 2) en vóór de prijstabel (page 4) een nieuwe pagina toevoegen per product dat een datasheet heeft. 

**Per product met datasheet:**
- **Fabrikant-datasheet** (`datasheet_type === "fabrikant"`): Embed de PDF via `<iframe>` met de publieke URL uit storage. Bij print wordt de iframe mee afgedrukt.
- **Gegenereerd datasheet** (`datasheet_type === "gegenereerd"`): Render het bestaande `ProductDatasheet` component inline (dat al bestaat en een printbare layout heeft).

### Wijzigingen

| Bestand | Actie |
|---------|-------|
| `src/components/OffertePDFPreview.tsx` | Na de productpagina (regel ~377) een loop toevoegen over `producten` die een `datasheet_url` of `datasheet_type` hebben. Per product een nieuwe `pdf-page` div met een `<iframe>` (fabrikant) of `<ProductDatasheet>` (gegenereerd). |

### Technische details

- De `datasheet_url` voor fabrikant-type bevat een storage path (bijv. `datasheets/uuid.pdf`). De publieke URL wordt samengesteld als: `${VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${datasheet_url}`
- De iframe krijgt `width="100%" height="100%"` en `style={{ border: 'none', minHeight: '267mm' }}` zodat het de A4-pagina vult
- Voor gegenereerde datasheets: importeer `ProductDatasheet` en render met productdata + partner branding (die al beschikbaar is)
- Een `pageStyle` wordt toegepast zodat elke datasheet op een eigen pagina komt bij printen

