

## Plan: PDF pagina omzetten naar volledige editor met live preview + fix overlappende knoppen

### Probleem
1. De `/offertes/:id/pdf` pagina toont alleen een statische PDF-preview zonder bewerkingsmogelijkheden — de gebruiker verwacht hier de template builder met live customization.
2. De actieknoppen (PDF downloaden, Verstuur per e-mail, Terug) zijn `position: fixed` en overlappen met de AppHeader omdat de pagina binnen `AppLayout` rendert (met sidebar + header).

### Oplossing

#### 1) Merge de template builder IN de PDF pagina
**Bestand:** `src/pages/OffertePDF.tsx`

Herschrijf deze pagina naar een fullscreen editor (vergelijkbaar met `OfferteTemplatePage`) maar dan met **echte offerte-data** in plaats van sample data:

- **Links panel (420px):** Sectie-selectie met variant-thumbnails, section toggles, tekst-aanpassing (badges, hero titel, hero afbeelding, akkoord tekst) — hergebruik exact dezelfde UI als `OfferteTemplatePage`
- **Rechts panel:** Live preview van de daadwerkelijke offerte (de huidige `OffertePDFPreview` logica) met zoom-slider
- **Actie-balk bovenaan rechts panel (NIET fixed):** PDF downloaden, Verstuur per e-mail, Terug — als onderdeel van de flow, niet overlappend

De template config wordt geladen vanuit de offerte (`offerte.template_config`) en bij "Opslaan" opgeslagen naar de database.

#### 2) Fix overlapping knoppen
**Bestand:** `src/components/OffertePDFPreview.tsx`

Verwijder de `position: fixed` action bar. De knoppen komen in het bovenste panel van de nieuwe editor-pagina.

#### 3) Route aanpassing
**Bestand:** `src/App.tsx`

De route `/offertes/:id/pdf` blijft, maar rendert nu de nieuwe editor-component.

### Aanpak

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/OffertePDF.tsx` | Herschrijf naar fullscreen split-view editor met links sectie-selectie en rechts live preview met echte data |
| `src/components/OffertePDFPreview.tsx` | Verwijder fixed action bar, exporteer de render-logica als herbruikbare component die props accepteert voor template config |
| `src/App.tsx` | Geen wijziging nodig — route blijft `/offertes/:id/pdf` binnen AppLayout |

### Technische aanpak

De nieuwe `OffertePDF` pagina:
1. Laadt offerte + partner + producten + schouw + adviseur data (bestaande logica uit `OffertePDFPreview`)
2. Initialiseert `config` state vanuit `offerte.template_config`
3. Toont links de sectie-kiezer (hergebruik van `OfferteTemplatePage` patronen)
4. Rendert rechts de live preview met echte data, reagerend op config-wijzigingen
5. "Opslaan" slaat `template_config` op naar de offerte in de database
6. "PDF downloaden" triggert `window.print()` met alleen het preview-gedeelte
7. "Verstuur per e-mail" navigeert naar `/offertes/:id?email=true`

De layout wordt `h-[calc(100vh-72px)]` zodat het past onder de AppHeader zonder overlap.

