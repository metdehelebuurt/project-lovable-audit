

## Plan: Navigatie-links omzetten naar afzonderlijke pagina's

### Probleem
De navlinks "Features", "Hoe het werkt" en "Voordelen" zijn anchor-links (`#features`, `#hoe-het-werkt`, `#voordelen`) die alleen op de homepage werken. Op andere pagina's doen ze niets.

### Oplossing
Drie nieuwe routes aanmaken en de navbar aanpassen naar echte paginalinks.

**Nieuwe pagina's (in `src/pages/website/`):**

1. **`Features.tsx`** — Overzichtspagina met alle 8 feature-kaarten (hergebruikt `ServicesSection` content) + links naar individuele feature-pagina's
2. **`HoeHetWerkt.tsx`** — Hergebruikt `HowItWorksSection` content als volledige pagina met CTASection onderaan
3. **`Voordelen.tsx`** — Hergebruikt `BenefitsSection` content als volledige pagina met CTASection onderaan

**`Navbar.tsx`** — Alle navLinks worden routes:
```
{ label: "Features", href: "/features", isRoute: true },
{ label: "Hoe het werkt", href: "/hoe-het-werkt", isRoute: true },
{ label: "Voordelen", href: "/voordelen", isRoute: true },
{ label: "Prijzen", href: "/prijzen", isRoute: true },
```
Verwijder de `scrollTo` functie — alles is nu `<Link>`.

**`App.tsx`** — 3 routes toevoegen binnen `<WebsiteLayout>`:
- `/features` → `Features`
- `/hoe-het-werkt` → `HoeHetWerkt`
- `/voordelen` → `Voordelen`

**`Home.tsx`** — Homepage behoudt alle secties (scroll anchors blijven werken voor directe bezoekers), geen wijzigingen nodig.

### Bestanden
| Bestand | Actie |
|---------|-------|
| `src/pages/website/Features.tsx` | **Nieuw** |
| `src/pages/website/HoeHetWerkt.tsx` | **Nieuw** |
| `src/pages/website/Voordelen.tsx` | **Nieuw** |
| `src/components/website/Navbar.tsx` | Links → routes |
| `src/App.tsx` | 3 routes toevoegen |

