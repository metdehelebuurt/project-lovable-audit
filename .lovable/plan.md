

## Plan: Fix gegenereerde datasheet opslag + per-partner datasheet support

### Status: ✅ Geïmplementeerd

### Wijzigingen

1. **Nieuwe tabel `partner_product_datasheets`** — Slaat per partner/product-combinatie op of er een datasheet is gegenereerd of geüpload, inclusief specs snapshot en PDF URL.

2. **Edge function `ai-verify-product-specs`** — Accepteert nu `partner_id` en upsert automatisch in `partner_product_datasheets` na specs-generatie via service role.

3. **`ProductDetail.tsx`** — Haalt partner-specifieke datasheet op uit nieuwe tabel. Toont inline preview bij gegenereerde datasheets. "PDF opslaan" knop genereert echte PDF via html2canvas + jsPDF en uploadt naar storage. Fabrikant uploads gaan nu naar partner-specifieke storage pad.

4. **`OffertePDFPreview.tsx`** — Toont datasheets ook voor producten met gevulde specs (niet alleen als `datasheet_type` gezet is).

5. **Dependencies** — `html2canvas` + `jspdf` toegevoegd.
