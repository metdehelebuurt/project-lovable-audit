

## Plan: Publieke Marketing Website voor mijnhuis.nu

### Overzicht
Een moderne, strakke marketing website bouwen als public-facing landingspagina op `/` (root), met de bestaande app achter `/dashboard` etc. De website richt zich op consumenten die duurzame woningverbeteringen zoeken.

### Pagina's en Secties

**1. Homepage (`/`) - `src/pages/Home.tsx`**
- **Hero sectie**: Grote headline, subtekst, CTA-button "Start je verduurzaming" + "Inloggen" link. Achtergrond met subtiel gradient paars.
- **Diensten sectie**: 3-4 kaarten met iconen (Zonnepanelen, Warmtepomp, Isolatie, Laadpaal) in een grid.
- **Hoe het werkt**: 3-stappen uitleg met nummers (1. Aanvraag, 2. Schouw, 3. Installatie).
- **Voordelen/USP's**: Grid met voordelen (Gecertificeerde installateurs, Persoonlijk advies, Scherpe prijzen, Subsidie-hulp).
- **Testimonials/Social proof**: Quotes van tevreden klanten (placeholder data).
- **CTA-banner**: Afsluitende call-to-action met contact/aanvraag knop.
- **Footer**: Links, logo, contactgegevens, copyright.

**2. Navbar component - `src/components/website/Navbar.tsx`**
- Sticky header met Logo, navigatie links (Home, Diensten, Hoe het werkt, Over ons), en "Inloggen" / "Offerte aanvragen" buttons.
- Mobiel hamburger menu.

**3. Footer component - `src/components/website/Footer.tsx`**
- Kolommen: Over mijnhuis.nu, Diensten, Contact, Socials.

### Routing wijzigingen (`App.tsx`)
- `/` toont `Home` (was `Navigate to /dashboard`)
- Ingelogde gebruikers kunnen via `/dashboard` naar het platform

### Technische aanpak
- Alle website componenten in `src/components/website/` map
- Gebruik bestaande design tokens (primary paars `#5B58E1`, Rubik font, rounded-pill buttons)
- Tailwind animaties en scroll-gebaseerde fade-ins via `tailwindcss-animate`
- Volledig responsive (mobile-first)
- Geen database nodig, puur statische content

### Bestanden
| Actie | Bestand |
|-------|---------|
| Nieuw | `src/pages/Home.tsx` |
| Nieuw | `src/components/website/Navbar.tsx` |
| Nieuw | `src/components/website/Footer.tsx` |
| Nieuw | `src/components/website/HeroSection.tsx` |
| Nieuw | `src/components/website/ServicesSection.tsx` |
| Nieuw | `src/components/website/HowItWorksSection.tsx` |
| Nieuw | `src/components/website/BenefitsSection.tsx` |
| Nieuw | `src/components/website/TestimonialsSection.tsx` |
| Nieuw | `src/components/website/CTASection.tsx` |
| Edit  | `src/App.tsx` — route `/` naar `Home`, dashboard redirect voor ingelogde users |

