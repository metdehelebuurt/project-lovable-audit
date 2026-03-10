

## Plan: Website Herpositionering naar B2B SaaS Platform

### Probleem
De huidige website richt zich op consumenten (huiseigenaren) die hun huis willen verduurzamen. De werkelijke doelgroep is **installateurs en adviseurs in de verduurzamingsbranche** die software nodig hebben voor offertes, adviezen, planning etc.

### Aanpak
Alle 8 website-componenten herschrijven met B2B SaaS positionering + parallax achtergrondeffect toevoegen.

### Nieuwe Waardepropositie
**"De alles-in-één software voor verduurzamingsprofessionals"** — Offertes op locatie, digitale schouwen, planning, klantbeheer, alles in één platform.

### Wijzigingen per component

**1. `HeroSection.tsx`** — Nieuwe headline: "Software die je verduurzamingsbedrijf laat groeien". Subtekst over offertes op locatie, digitale schouwen, klantbeheer. CTA: "Start gratis proefperiode" + "Bekijk demo". Social proof: "500+ professionals gebruiken mijnhuis.nu". Parallax achtergrond met `background-attachment: fixed`.

**2. `ServicesSection.tsx`** → **Features sectie**: 4 kaarten met platform features:
- Offertes op locatie (direct professionele offertes genereren)
- Digitale schouwen (formulieren, foto's, rapportages)
- Planning & agenda (installaties en afspraken beheren)
- Klant- & leadbeheer (CRM pipeline)

**3. `HowItWorksSection.tsx`** — 3 stappen: 1. Account aanmaken, 2. Team & producten instellen, 3. Direct aan de slag op locatie.

**4. `BenefitsSection.tsx`** — USP's voor professionals: Meer omzet, minder administratie, professionele uitstraling, alles in de cloud.

**5. `TestimonialsSection.tsx`** — Quotes van installatiebedrijven en adviseurs.

**6. `CTASection.tsx`** — "Start vandaag nog" met proefperiode CTA.

**7. `Navbar.tsx`** — Links updaten: Features, Hoe het werkt, Prijzen. CTA: "Gratis proberen".

**8. `Footer.tsx`** — Kolommen updaten naar B2B context.

**9. Parallax effect** — CSS `background-attachment: fixed` op Hero en CTA secties met subtiele patronen/gradients. Eventueel een tussenliggende parallax-banner sectie.

### Bestanden
| Actie | Bestand |
|-------|---------|
| Edit | `src/components/website/HeroSection.tsx` |
| Edit | `src/components/website/ServicesSection.tsx` |
| Edit | `src/components/website/HowItWorksSection.tsx` |
| Edit | `src/components/website/BenefitsSection.tsx` |
| Edit | `src/components/website/TestimonialsSection.tsx` |
| Edit | `src/components/website/CTASection.tsx` |
| Edit | `src/components/website/Navbar.tsx` |
| Edit | `src/components/website/Footer.tsx` |

