

## Plan: Grafisch verbeterde offerte-PDF met voorblad, inhoudsopgave en live template builder

### Status: ✅ Geïmplementeerd

### Wat is gebouwd

1. **Voorblad met instelbare hero-afbeelding** — Alle 5 voorblad-templates ondersteunen een configureerbare achtergrondafbeelding (`heroImageUrl`) en grote titel (`heroTitle`, standaard "Offerte").

2. **Inhoudsopgave pagina** — Automatisch gegenereerde pagina 2 met overzicht van alle actieve secties, paginanummers, en decoratieve styling in huisstijlkleuren.

3. **Paginanummering** — Alle pagina's tonen een paginanummer rechtsonder.

4. **Live template builder uitbreiding** — Zoom slider (25%-100%), hero-afbeelding URL invoerveld met preview, instelbare voorblad-titel, inhoudsopgave in live preview.

### Bestanden gewijzigd

| Bestand | Wijziging |
|---------|-----------|
| `src/components/offertes/templates/VoorbladTemplates.tsx` | Hero image overlay, grote titel, alle 5 templates bijgewerkt |
| `src/components/offertes/templates/templateRegistry.ts` | `hero_image_url` en `hero_title` toegevoegd aan TemplateConfig |
| `src/components/OffertePDFPreview.tsx` | Inhoudsopgave pagina, paginanummering, hero props doorgeven |
| `src/pages/OfferteTemplatePage.tsx` | Zoom slider, hero inputs, TOC in live preview |
