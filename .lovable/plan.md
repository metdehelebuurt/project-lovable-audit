

## Plan: Grafisch verbeterde offerte-PDF met voorblad, inhoudsopgave en live template builder

### Wat wordt gebouwd

1. **Voorblad met instelbare hero-afbeelding** — Alle 5 voorblad-templates krijgen ondersteuning voor een configureerbare achtergrondafbeelding. Het woord "Offerte" (of een instelbare titel) wordt prominent groot weergegeven. Partners kunnen via de template builder een afbeelding-URL instellen en de titel aanpassen.

2. **Inhoudsopgave pagina** — Automatisch gegenereerde tweede pagina met overzicht van alle secties in de offerte (Voorblad, Producten, Prijstabel, Energieadvies, Voorwaarden, Schouwrapport, Datasheets) met paginanummers. Stijl volgt de gekozen huisstijlkleuren.

3. **Grafisch aantrekkelijker design** — Alle pagina's krijgen paginanummering, verfijnde typografie, decoratieve elementen (kleuraccenten, lijnen, achtergrondpatronen) en betere witruimte.

4. **Live template builder uitbreiding** — De bestaande `OfferteTemplatePage` wordt uitgebreid met:
   - Hero-afbeelding URL invoerveld + preview
   - Instelbare voorblad-titel (standaard "Offerte")
   - Pixel-perfect live preview op ware A4-schaal met zoom-slider
   - Paginanummering in preview

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/offertes/templates/VoorbladTemplates.tsx` | Alle 5 templates: `heroImageUrl` en `heroTitle` props toevoegen, grote "Offerte" titel, achtergrondafbeelding met overlay |
| `src/components/offertes/templates/templateRegistry.ts` | `TemplateConfig` uitbreiden met `hero_image_url`, `hero_title` |
| `src/components/OffertePDFPreview.tsx` | Inhoudsopgave pagina toevoegen na voorblad, paginanummering op alle pagina's, hero-afbeelding + titel doorgeven aan voorblad |
| `src/pages/OfferteTemplatePage.tsx` | Hero-afbeelding URL veld, titel veld, zoom-slider voor preview, inhoudsopgave in preview |

### Technische details

**VoorbladTemplates** — Nieuwe props:
```typescript
interface VoorbladProps {
  // ... bestaande props
  heroImageUrl?: string | null;  // achtergrondafbeelding
  heroTitle?: string;            // standaard "Offerte"
}
```

Elke template variant krijgt de afbeelding als achtergrond met een donkere overlay voor leesbaarheid, en de `heroTitle` als groot typografisch element (48-64px font).

**Inhoudsopgave** — Nieuw component inline in `OffertePDFPreview.tsx`:
- Automatisch detecteren welke secties actief zijn
- Visueel aantrekkelijk met kleuraccenten, regelnummers en decoratieve lijnen
- Pagina 2 in de PDF (na voorblad)

**Template builder** — Uitbreiding van het "Tekst aanpassen" panel:
- Input veld voor `hero_title` (standaard "Offerte")
- Input veld voor `hero_image_url` (URL naar afbeelding)
- Zoom slider (25%-100%) voor de live preview zodat je pixel-perfect kunt controleren
- De live preview toont ook de inhoudsopgave

**TemplateConfig** uitbreiding:
```typescript
hero_image_url?: string;  // URL naar voorblad afbeelding
hero_title?: string;      // Standaard "Offerte"
```

Opgeslagen in `offerte.template_config` JSON kolom (bestaand, geen migratie nodig).

