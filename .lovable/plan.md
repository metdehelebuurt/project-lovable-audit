

## Plan: Navbar fixen en pagina's volwaardig maken

### Gevonden problemen

1. **HeroSection "Bekijk features" button** gebruikt nog `scrollTo("#features")` — werkt alleen op de homepage
2. **Features, Hoe het werkt, Voordelen pagina's** zijn te dun — ze tonen alleen de sectie-content met een CTA, zonder eigen introductie, context of verdieping. Ze voelen niet als volwaardige pagina's.
3. **Homepage (`/`)** rendert zijn eigen Navbar los van WebsiteLayout — dit is inconsistent maar functioneel correct

### Aanpassingen

**1. `HeroSection.tsx`** — Fix anchor-scroll button
- "Bekijk features" button: wijzig `scrollTo("#features")` naar `navigate("/features")`

**2. `Features.tsx`** — Uitbreiden tot volwaardige pagina
- Hero-banner bovenaan met titel en uitgebreide introductie
- 8 feature-kaarten met links naar detail-pagina's (bestaand)
- Extra sectie: "Waarom alles-in-één?" met 3-4 USP's
- CTASection onderaan (bestaand)

**3. `HoeHetWerkt.tsx`** — Uitbreiden tot volwaardige pagina
- Hero-banner met context over onboarding
- 3 stappen (bestaand) maar uitgebreider met meer detail per stap
- Extra sectie: "Veelgestelde vragen over starten" of "Binnen 5 minuten live"
- Testimonial of quote sectie
- CTASection onderaan

**4. `Voordelen.tsx`** — Uitbreiden tot volwaardige pagina
- Hero-banner met sterke value proposition
- 6 voordelen-kaarten (bestaand)
- Extra sectie: statistieken/cijfers ("30% meer omzet", "2 uur per dag bespaard")
- Vergelijkingstabel: zonder vs. met mijnhuis.nu
- CTASection onderaan

### Bestanden die wijzigen
| Bestand | Actie |
|---------|-------|
| `src/components/website/HeroSection.tsx` | scrollTo → navigate |
| `src/pages/website/Features.tsx` | Uitbreiden met hero + USP sectie |
| `src/pages/website/HoeHetWerkt.tsx` | Uitbreiden met hero + extra secties |
| `src/pages/website/Voordelen.tsx` | Uitbreiden met hero + stats + vergelijking |

