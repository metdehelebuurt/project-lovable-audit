

## Plan: Footer pagina's ontwikkelen

### Analyse
De footer bevat 12 niet-werkende links verdeeld over 3 categorieën:

**Platform (5 feature-pagina's):** Offertes op locatie, Digitale schouwen, Planning & agenda, Klant- & leadbeheer, Rapportages
**Bedrijf (4 pagina's):** Over ons, Prijzen, Partners worden, Veelgestelde vragen
**Juridisch (3 pagina's):** Privacy, Voorwaarden, Cookies

### Aanpak

Elke pagina krijgt: Navbar + Footer (consistent met Home), rijke SEO-vriendelijke content, interne links naar gerelateerde pagina's, CTA's naar `/signup`, visuele elementen (iconen, cards, afbeeldingen in WebP).

### Bestanden

| Actie | Bestand | Doel |
|-------|---------|------|
| Create | `src/pages/website/FeatureOffertes.tsx` | Feature-pagina offertes op locatie |
| Create | `src/pages/website/FeatureSchouwen.tsx` | Feature-pagina digitale schouwen |
| Create | `src/pages/website/FeaturePlanning.tsx` | Feature-pagina planning & agenda |
| Create | `src/pages/website/FeatureLeadbeheer.tsx` | Feature-pagina klant- & leadbeheer |
| Create | `src/pages/website/FeatureRapportages.tsx` | Feature-pagina rapportages |
| Create | `src/pages/website/OverOns.tsx` | Over ons pagina |
| Create | `src/pages/website/Prijzen.tsx` | Prijzen pagina met plannen |
| Create | `src/pages/website/PartnersWorden.tsx` | Partners worden pagina |
| Create | `src/pages/website/FAQ.tsx` | Veelgestelde vragen (accordion) |
| Create | `src/pages/website/Privacy.tsx` | Privacybeleid |
| Create | `src/pages/website/Voorwaarden.tsx` | Algemene voorwaarden |
| Create | `src/pages/website/CookieBeleid.tsx` | Cookiebeleid |
| Create | `src/components/website/WebsiteLayout.tsx` | Shared layout (Navbar + Footer) |
| Edit | `src/components/website/Footer.tsx` | Links koppelen aan routes |
| Edit | `src/components/website/Navbar.tsx` | Prijzen link toevoegen |
| Edit | `src/App.tsx` | 12 nieuwe routes registreren |

### Pagina-inhoud per type

**Feature-pagina's** (5 stuks):
- Hero met titel + korte beschrijving + WebP achtergrond
- "Wat kun je ermee" sectie met 4-6 feature cards
- Screenshot/visual placeholder sectie
- Gerelateerde features sectie (links naar andere feature-pagina's)
- CTA sectie naar `/signup`
- ~600-800 woorden per pagina voor SEO

**Over ons:**
- Missie & visie, teamwaarden, waarom mijnhuis.nu
- Statistieken (500+ gebruikers, etc.)
- CTA naar partners worden of signup

**Prijzen:**
- 3 plannen (Starter, Professional, Enterprise) in cards
- Feature vergelijkingstabel
- FAQ onder prijzen
- CTA per plan naar `/signup`

**Partners worden:**
- Voordelen van partnerschap, stappenplan, CTA-formulier
- Testimonial van bestaande partner

**FAQ:**
- Accordion met 10-15 vragen over platform, prijzen, trial, technisch
- Interne links naar relevante pagina's

**Juridische pagina's** (3 stuks):
- Zakelijke, professionele teksten
- Structuur met genummerde artikelen
- Laatste update datum

### Technische details

- `WebsiteLayout.tsx` wikkelt Navbar + Footer + `<Outlet />` zodat alle website-pagina's consistent zijn
- Alle Unsplash afbeeldingen met `&fm=webp` parameter
- Feature-pagina's linken onderling via "Ontdek ook" sectie
- Prijzen pagina highlight het populairste plan
- Footer links worden `<Link to="...">` ipv `<span>` / `<li>`

