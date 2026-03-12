

## Plan: Offerte PDF-generatie met huisstijl & optionele schouw/energieadvies

### 1. Database: Huisstijl velden op `partners` tabel

Migratie toevoegen voor branding-velden op de bestaande `partners` tabel:
- `primaire_kleur` (text, default '#5B58E1')
- `secundaire_kleur` (text, default '#1a1a2e')
- `bedrijfsslogan` (text, nullable)

`logo_url` bestaat al. Storage bucket `product-images` is al public — hergebruiken of een nieuwe `partner-assets` bucket aanmaken.

### 2. Instellingen: Organisatie huisstijl sectie

In `src/pages/Instellingen.tsx` een nieuwe card toevoegen (alleen voor `partner_admin`) met:
- Logo upload (naar storage bucket)
- Primaire kleur picker (hex input)
- Secundaire kleur picker
- Bedrijfsslogan
- Live preview van hoe de offerte-header eruitziet

### 3. Edge Function: `generate-offerte-pdf`

Nieuwe edge function die een offerte-ID ontvangt en een gestylde HTML-pagina rendert die als PDF gedownload kan worden. Aanpak: **HTML-gebaseerde "print-ready" pagina** in plaats van server-side PDF (geen externe libs nodig).

Alternatief: client-side PDF via `window.print()` op een speciale offerte-preview pagina met `@media print` styling.

**Gekozen aanpak: Client-side print-ready preview pagina** — geen extra edge function nodig, werkt direct met `window.print()` / "Opslaan als PDF".

### 4. Offerte PDF Preview component

Nieuw bestand `src/components/OffertePDFPreview.tsx`:
- Full-page print-optimized layout
- Header met partner logo, naam, adres, KvK, BTW in huisstijlkleuren
- Offertenummer, datum, geldig tot
- Klantgegevens blok
- Regels tabel met subtotalen
- Totalen sectie
- **Optioneel:** Schouwgegevens sectie (als schouw_id gekoppeld)
- **Optioneel:** Energieadvies sectie (berekend op basis van schouw-specs)
- Footer met betalingsvoorwaarden, contactinfo
- `@media print` CSS voor propere PDF output

### 5. Offerte Preview pagina / route

Nieuwe route `/offertes/:id/pdf` die de preview rendert. Automatisch `window.print()` trigger of print-knop.

### 6. UI: Download knop in Offertes

In de view dialog en tabel-acties een "PDF" knop toevoegen die navigeert naar de print-preview.

### 7. Offertes: Optionele schouw & energieadvies inclusie

In het create/edit formulier checkboxes toevoegen:
- ☐ Schouwgegevens opnemen in offerte
- ☐ Energieadvies opnemen in offerte

Deze worden opgeslagen als extra velden in de offerte `regels` JSONB of als losse booleans.

### Bestanden

| Actie | Bestand |
|-------|---------|
| Migration | Huisstijl velden op `partners` + `offerte_opties` op `offertes` |
| Create | `src/components/OffertePDFPreview.tsx` |
| Create | `src/pages/OffertePDF.tsx` (route pagina) |
| Edit | `src/pages/Offertes.tsx` (PDF knop + opties checkboxes) |
| Edit | `src/pages/Instellingen.tsx` (huisstijl card) |
| Edit | `src/App.tsx` (route toevoegen) |

### Technische details

- Partner branding wordt opgehaald bij het renderen van de PDF preview
- Schouwgegevens worden opgehaald via `schouw_id` als de optie is aangevinkt
- Energieadvies wordt client-side berekend met dezelfde logica als `Energieadvies.tsx`
- Print CSS: `@media print { @page { size: A4; margin: 15mm; } }`, verberg navigatie
- Kleuren via CSS custom properties zodat partner huisstijl dynamisch wordt toegepast
- Storage bucket voor logo uploads (partner-assets)

