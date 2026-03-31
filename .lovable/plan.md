

## Plan: Commercieel aantrekkelijke productpagina toevoegen aan PDF editor

### Concept

Een nieuw template **"product-showcase"** dat elk product een eigen volledige pagina geeft met een groot centraal productbeeld, USP-badges, en gestructureerde productinfo — vergelijkbaar met een commercieel productblad/brochure.

### Design per product-pagina

```text
┌──────────────────────────────────────┐
│  [logo]              partner contact │  ← PageHeader
│──────────────────────────────────────│
│                                      │
│  MERK — MODEL                        │
│  ████████████████████████████████     │
│  █                              █    │
│  █    GROTE PRODUCTFOTO         █    │  ← 280px hoog, lichtgrijze bg
│  █    (centraal, contain)       █    │
│  █                              █    │
│  ████████████████████████████████     │
│                                      │
│  ═══ Productnaam ═══                 │  ← groot, bold, sc kleur
│                                      │
│  Omschrijving tekst...               │
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │🛡 10j │ │✓ IEC │ │🔧    │         │  ← USP badges (garantie,
│  │garant│ │cert  │ │onderh│         │     certificeringen, onderhoud)
│  └──────┘ └──────┘ └──────┘         │
│                                      │
│  Spec key    │ Spec value            │  ← Top 6 specs in 2-kolom
│  Spec key    │ Spec value            │     striped tabel
│──────────────────────────────────────│
│  partner footer                      │  ← PageFooter
└──────────────────────────────────────┘
```

Elk product krijgt een eigen `.pdf-page` — dit geeft maximale visuele impact en voorkomt dat content samengeperst wordt.

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/offertes/templates/ProductTemplates.tsx` | Nieuw `ProductShowcase` component: full-page layout per product met grote foto (280px), USP-badges, top-specs tabel |
| `src/components/offertes/templates/templateRegistry.ts` | Nieuwe variant `product-showcase` ("Commercieel") toevoegen aan producten-secties |
| `src/components/OffertePDFPreview.tsx` | Bij `case "producten"`: als template `product-showcase` is, render meerdere `.pdf-page` divs (één per product) i.p.v. één pagina met alle producten |

### Technische details

- **ProductShowcase** rendert per product (niet als lijst) — de parent in `OffertePDFPreview` loopt over producten en maakt per product een aparte `.pdf-page`
- Grote afbeelding: `width: 100%, height: 280px, objectFit: contain, backgroundColor: #f8f8fa, borderRadius: 16px`
- USP-badges: garantie, certificeringen, onderhoud als horizontale pill-badges in `pcTint` kleur
- Specs: maximaal 6 meest relevante specs in gestreepte 2-kolom tabel
- Bestaande templates (list, cards, grid, spotlight) blijven ongewijzigd

