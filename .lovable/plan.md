

## Plan: Qwilr-achtige Offerte Template Builder

### Kernproblemen (vanuit sales/design perspectief)

1. **Thumbnails zijn onleesbaar** — 794px geschaald naar ~18% = wireframe-achtige blurry blokjes, niet herkenbaar als design
2. **Gekozen templates worden NIET toegepast** — `OffertePDFPreview.tsx` negeert de `template_config` varianten volledig en rendert altijd dezelfde hardcoded layout. De hele builder is dus cosmetisch.
3. **Dialog in plaats van pagina** — te krap, geen ruimte voor preview
4. **Geen customization** — alleen variant kiezen, geen kleur/font/volgorde/sectietoggle aanpassingen
5. **Geen live preview** — je ziet niet hoe de volledige offerte eruitziet met je keuzes

### Aanpak

**1. Template Builder → volwaardige pagina (`/offertes/template`)**
- Vervang de dialog door een fullscreen split-view pagina:
  - **Links (40%)**: Sectie-selectie met grotere, duidelijkere thumbnails (aspect-ratio 3:4, geschaald naar ~30% ipv 18%), gegroepeerd per sectie als horizontale carousel
  - **Rechts (60%)**: Live scrollbare preview van de volledige offerte met sample data, die direct meeverandert bij elke keuze
- Sectie-toggles: secties aan/uit zetten (voorblad, energieadvies, schouwrapport)
- Per-sectie customization panel (klapbaar):
  - Badges tekst aanpassen
  - Akkoordtekst aanpassen
  - Sectievolgorde drag-and-drop (later fase)

**2. OffertePDFPreview.tsx: template varianten daadwerkelijk renderen**
- Importeer alle template component maps (`voorbladTemplates`, `productTemplates`, `prijstabelTemplates`, `energieadviesTemplates`, `voorwaardenTemplates`)
- Lees `template_config.voorblad`, `.producten`, `.prijstabel`, `.energieadvies`, `.voorwaarden` uit de offerte
- Render de gekozen variant-component ipv hardcoded layout
- Fallback naar huidige hardcoded layout als geen config aanwezig (backward compatibility)

**3. Thumbnail verbetering**
- Vergroot preview container: `aspect-[3/4]` met `scale(0.28)` ipv `scale(0.18)`
- Voeg subtiele label-overlay toe met variant naam
- Gebruik partner-kleuren in sample data ipv hardcoded `#5B58E1`

**4. OfferteNieuw.tsx + Offertes.tsx integratie**
- "Template aanpassen" knop navigeert naar `/offertes/template` ipv dialog openen
- Template config wordt opgeslagen en doorgegeven bij offerte-creatie
- Bij bestaande offertes: template wijzigen via dezelfde pagina

### Bestanden

| Bestand | Actie |
|---------|-------|
| `src/pages/OfferteTemplatePage.tsx` | **Nieuw** — Fullscreen split-view builder |
| `src/components/offertes/OfferteTemplateBuilder.tsx` | Refactor naar inline component (niet meer dialog) |
| `src/components/OffertePDFPreview.tsx` | Template varianten daadwerkelijk renderen |
| `src/pages/OfferteNieuw.tsx` | Navigatie naar template pagina |
| `src/App.tsx` | Nieuwe route `/offertes/template` |
| `src/components/offertes/templates/templateRegistry.ts` | Sectie-toggles + volgorde config toevoegen aan `TemplateConfig` |

### Acceptatiecriteria
1. Template builder is een volwaardige pagina met live preview rechts
2. Thumbnails zijn duidelijk herkenbaar (niet meer wireframe-achtig)
3. Gekozen template varianten worden daadwerkelijk toegepast in de PDF preview en publieke offerte
4. Secties kunnen aan/uit worden gezet
5. Badges en akkoordtekst zijn aanpasbaar vanuit de builder

