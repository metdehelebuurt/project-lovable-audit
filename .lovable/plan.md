

## Plan: Website bijwerken naar alle platformfuncties

### Analyse — Wat ontbreekt

De website toont slechts 4 features terwijl het platform er 10+ heeft. Nieuwe features die ontbreken op de website:
- **Rapportages & Analytics** (heeft wel feature-pagina, niet in ServicesSection)
- **Webtools** (embeddable calculatoren & contactformulieren)
- **Energieadvies & Thuisbatterij Selector** (adviestools)
- **Documentbeheer**
- **Productcatalogus**
- **Affiliate/Wederverkoper programma**
- **Installatiebeheer**

### Aanpassingen

**1. `ServicesSection.tsx`** — Van 4 naar 8 features:
- Bestaande 4 behouden
- Toevoegen: Rapportages & analytics (BarChart3), Webtools (Globe), Energieadvies tools (Lightbulb), Documentbeheer (FolderOpen)
- Grid aanpassen naar 2 rijen van 4
- Elke kaart wordt klikbaar met link naar bijbehorende feature-pagina

**2. Nieuwe feature-pagina's aanmaken:**
- `src/pages/website/FeatureWebtools.tsx` — Embeddable widgets, calculatoren, contactformulieren
- `src/pages/website/FeatureEnergieadvies.tsx` — Energieadvies wizard, thuisbatterij selector
- Routes toevoegen in `App.tsx`

**3. `Navbar.tsx`** — Features dropdown of extra links:
- "Features" link → anchor scroll behouden
- Toevoegen: "Affiliate worden" link naar `/partners-worden`

**4. `HeroSection.tsx`** — Subtitel bijwerken:
- Toevoegen: "energieadvies tools, webtools voor je website" bij de feature-opsomming
- Tekst aanpassen zodat het de breedte van het platform weerspiegelt

**5. `BenefitsSection.tsx`** — Toevoegen:
- "Website-widgets" benefit: embed calculatoren op je eigen site
- "Affiliate programma" benefit: verdien mee als wederverkoper
- Van 4 naar 6 benefits (3x2 grid)

**6. `Footer.tsx`** — Platform kolom uitbreiden:
- Toevoegen: Webtools, Energieadvies, Affiliate programma links

**7. `Prijzen.tsx`** — Plan features bijwerken:
- Starter: + "Energieadvies tools", "1 webtool widget"
- Professional: + "Onbeperkt webtools", "Thuisbatterij selector", "Documentbeheer"
- Enterprise: + "Affiliate programma", "White-label webtools"

**8. `CTASection.tsx`** — Button fix:
- Achtergrond is `bg-primary/90` (paars), button `variant="secondary"` heeft `bg-secondary text-secondary-foreground` (licht paars bg, donker paars tekst) — dit is correct qua contrast
- Verifieer en fix eventuele contrast-issues in FeaturePageLayout CTA sectie

**9. `FAQ.tsx`** — Nieuwe vragen toevoegen:
- Categorie "Webtools": vragen over embeddable widgets
- Categorie "Affiliate programma": hoe word je affiliate, commissiestructuur

**10. `FeaturePageLayout.tsx`** — relatedPages bijwerken in bestaande feature-pagina's:
- Webtools en Energieadvies toevoegen aan "Ontdek ook" secties

### Button contrast fixes
- `FeaturePageLayout.tsx` CTA sectie: `bg-primary` met `variant="secondary"` button — secondary-foreground is donker paars op licht paars achtergrond, prima contrast
- Controleer of er buttons zijn waar tekst en achtergrond dezelfde kleur hebben en fix die

### Bestanden die wijzigen
| Bestand | Actie |
|---------|-------|
| `src/components/website/ServicesSection.tsx` | 4→8 features, klikbare kaarten |
| `src/components/website/HeroSection.tsx` | Subtitel bijwerken |
| `src/components/website/BenefitsSection.tsx` | 4→6 benefits |
| `src/components/website/Footer.tsx` | Extra links |
| `src/components/website/CTASection.tsx` | Contrast check/fix |
| `src/pages/website/Prijzen.tsx` | Features per plan bijwerken |
| `src/pages/website/FAQ.tsx` | Nieuwe categorieën |
| `src/pages/website/FeatureWebtools.tsx` | **Nieuw** |
| `src/pages/website/FeatureEnergieadvies.tsx` | **Nieuw** |
| `src/pages/website/FeatureOffertes.tsx` | relatedPages bijwerken |
| `src/pages/website/FeatureSchouwen.tsx` | relatedPages bijwerken |
| `src/pages/website/FeaturePlanning.tsx` | relatedPages bijwerken |
| `src/pages/website/FeatureLeadbeheer.tsx` | relatedPages bijwerken |
| `src/pages/website/FeatureRapportages.tsx` | relatedPages bijwerken |
| `src/App.tsx` | Nieuwe routes |

