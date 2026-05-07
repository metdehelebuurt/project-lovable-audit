# Redesign-advies publieke website mijnhuis.nu

Geschreven vanuit vier rollen: platformontwikkelaar, designer, webdeveloper en online marketeer. Doel: scherpere positionering, betere vindbaarheid (SEO), sterkere conversie en een eigen visuele identiteit die past bij een serieus B2B SaaS voor de verduurzamingsbranche.

---

## 1. Doelgroep — wie bedienen we écht?

**Primair (beslisser, betaalt):**
- **Eigenaren / directeuren van MKB-installatiebedrijven** (2–25 monteurs) in zonnepanelen, warmtepompen, thuisbatterijen, isolatie, laadpalen.
- Pijn: versnipperde tools (Excel + WhatsApp + losse offertesoftware), te weinig tijd voor sales, slechte grip op marges, geen klantportaal, schouw op papier.
- Drijfveren: meer omzet per FTE, professionele uitstraling richting consument, minder administratie, schaalbaarheid.

**Secundair (gebruikers / influencers):**
- **Verkoop-adviseurs & schouwers** die buiten de deur werken (mobiel-first, snelle offerte op locatie).
- **Planners / backoffice** (overzicht, facturatie, voorraad).
- **Energieadviseurs & onafhankelijke wederverkopers/affiliates**.

**Tertiair (indirect publiek):**
- Brancheorganisaties, leveranciers, partners die naar de site kijken voor geloofwaardigheid.

**Persona-snapshot — "Mark, 42, eigenaar zonnepanelenbedrijf"**
Heeft 6 monteurs en 2 verkopers. Werkt nu met Hellosales + Excel + Google Agenda. Wil niet "weer een tool" maar één systeem dat alles dekt — en dat z'n verkopers ook echt gebruiken. Beslist op basis van: demo, prijs, of het Nederlands is, of het past bij verduurzaming specifiek.

---

## 2. Marketing- & SEO-analyse

**Wat nu mist:**
- Generieke kop ("software die je bedrijf laat groeien") — geen specifieke branche-claim, lage SEO-relevantie.
- Geen branchenniches in URL/content (zonnepaneel-software, warmtepomp-CRM, schouw-app).
- Geen vergelijkingspagina's vs. bekende concurrenten (Hellosales, SolarMonkey, Trifact, Werkbon-apps).
- Geen casestudies / klantverhalen met cijfers.
- Geen kennisbank/blog → geen long-tail verkeer.
- Hero gebruikt fixed background image van Unsplash → traag (LCP) + niet on-brand.
- Footer/Navbar mist trustsignalen (klantlogo's, reviews, certificeringen, AVG, ISO).

**SEO-strategie — drie lagen:**

1. **Branche-landingen** (commercieel, hoge intent):
   - `/software-voor-zonnepanelenbedrijven`
   - `/software-voor-warmtepompinstallateurs`
   - `/software-voor-thuisbatterij-installateurs`
   - `/software-voor-isolatiebedrijven`
   - `/crm-voor-installateurs`
   - Per pagina: branche-specifieke screenshots, USP's, casestudie, FAQ-schema.

2. **Functie-landingen** (al deels aanwezig, uitbreiden):
   - Bestaande `/features/*` pagina's herschrijven met: probleem → oplossing → screenshot → mini-demo (GIF/video) → klantquote → CTA.
   - Toevoegen: `/schouw-app`, `/offerte-software`, `/digitale-werkbon`, `/klantportaal-installateur`.

3. **Kennislaag** (long-tail, autoriteit):
   - `/kennisbank` met artikelen: "Hoe schrijf je een offerte voor een warmtepomp", "ISDE-subsidie 2026 berekenen", "Schouwformulier zonnepanelen — gratis template".
   - Lead-magnets: gratis Excel-templates, ROI-calculator, voorbeeld-offerte → e-mailcapture → trial.

4. **Vergelijkingspagina's**:
   - `/vergelijken/mijnhuis-vs-hellosales`, etc. — eerlijk, transparant. Vangt "alternatief voor X"-zoekopdrachten.

**Technisch SEO (must-haves):**
- Lighthouse-score 90+ op LCP/CLS/INP. Nu: fixed background + Unsplash hero kost veel.
- Eigen brand-imagery (geen Unsplash) → optimized WebP, `width/height`, lazy-load onder de vouw.
- `useDocumentSeo` (bestaat al voor catalogus) uitrollen naar álle publieke pagina's: title, meta, canonical, OG, JSON-LD (`SoftwareApplication`, `Organization`, `FAQPage`, `BreadcrumbList`).
- `sitemap.xml` dynamisch + `robots.txt` aanvullen.
- Schema.org `Review`/`AggregateRating` met echte klantreviews.
- Interne linking: elke feature linkt naar 2 branche-landingen en 1 kennisartikel.

---

## 3. Contentstrategie & site-opbouw

**Nieuwe navigatie (max 5 items):**

```
Product       Voor wie              Prijzen   Kennis        Inloggen
 ├ Leads       ├ Zonnepanelen        (flat)   ├ Blog          [CTA: Gratis proberen]
 ├ Offertes    ├ Warmtepompen                 ├ Kennisbank
 ├ Schouwen    ├ Thuisbatterijen              ├ Templates
 ├ Planning    ├ Isolatie                     ├ Webinars
 ├ Klantportaal├ Laadpalen                    ├ Klantverhalen
 ├ Webtools    ├ Energieadviseurs
 ├ Facturatie  ├ Wederverkopers
 └ Alle features
```

**Homepage-opbouw (van boven naar onder):**

1. **Hero** — branchespecifieke claim + 1-zin subkop + 2 CTA's (Demo / 30 dagen gratis) + zichtbaar productbeeld (echte UI-screenshot in browser-frame, niet stockfoto).
2. **Trustbar** — 6–8 klantlogo's in grijswaarden + "Beoordeeld met 4.8 op Google".
3. **Probleem-frame** — "Herken je dit?" 3 pijnpunten met icoontjes.
4. **Productpijlers** — 3 grote blokken: *Verkoop sneller*, *Werk efficiënter*, *Maak klanten enthousiast*. Elk met 3 mini-features.
5. **Branche-switcher** — interactieve tabs: zonnepanelen / warmtepomp / thuisbatterij / isolatie → screenshot wisselt.
6. **Klantverhaal** (1 grote case) met meetbaar resultaat: "Van 4 naar 11 offertes per week".
7. **Hoe het werkt** — 4 stappen, kort.
8. **Pricing-teaser** — vanaf-prijs + link naar `/prijzen`.
9. **Reviews** (echt, met naam, foto, bedrijf, bron).
10. **Veelgestelde vragen** met JSON-LD `FAQPage` schema.
11. **Final CTA** — demo aanvragen + trial.

**Content-toon:**
Nederlands, zakelijk-direct, geen marketing-superlatieven. Werkwoorden vooraan ("Stuur offertes binnen 5 minuten"). Concrete getallen waar mogelijk. Geen jargon zonder uitleg. Geen emoji's (conform workspace-regels).

---

## 4. Designfilosofie — "Helder Vakmanschap"

> Een visuele taal die past bij de Nederlandse verduurzamingsprofessional: nuchter, betrouwbaar, modern, en tegelijk warm genoeg om uit de SaaS-eenheidsworst te springen.

**Kernprincipes:**

- **Architectonische rust.** Royale witruimte, strakke 12-koloms grid, generous line-height. De pagina ademt zoals een goed ontworpen woning. Geen visuele ruis, geen losse decoratieve illustraties.
- **Materiaaleerlijkheid.** Eén warm accent (diep paars `#5B58E1` blijft) tegenover een natuurlijk neutralenpalet: krijtwit, leisteengrijs, zacht antraciet. Optioneel een tweede accent in *zon-okergeel* of *mosgroen* voor branche-tinting (zonnepanelen vs. warmtepomp vs. isolatie).
- **Typografische hiërarchie als bouwtekening.** Eén display-font met karakter (bv. *Söhne*, *General Sans*, of *Inter Display*) voor headings — strak, geometrisch, met subtiele humanistische warmte. Inter of huidige Rubik voor body. Headings groot (clamp tot 80px), regelafstand krap. Body 17–18px, 1.6 line-height.
- **Productbeeld als held.** Echte UI-screenshots in subtiele browser-/device-frames met zachte schaduw, lichte tilt, parallax-loos. Geen stock-fotografie van handen-met-zonnepanelen meer. Optioneel: korte loop-video's (8–12 sec) van échte workflows.
- **Iconografie — één set, lijn-stijl.** Lucide of Phosphor (duotone), 1.5px stroke. Nooit kleuricoontjes mengen.
- **Micro-interacties met terughoudendheid.** Hover-states 150ms, scroll-reveal subtiel, geen parallax, geen confetti. Beweging onderstreept structuur, vervangt 'm niet.
- **Diepte via laag, niet via skeuomorfisme.** Zachte schaduwen (`0 1px 3px rgba(0,0,0,.05)`), 1px borders in `--border`, afgeronde hoeken consistent (16/20/24px stappen). Geen glassmorphism, geen gradient-soep.
- **Donker accent-blok.** Eén of twee secties per pagina in diep antraciet (`#0F172A`-achtig) met paars accent — om ritme en visuele pauze te creëren. Voorkomt de "alles is wit"-sleur.
- **Mobiel als eerste klas.** Hero leesbaar zonder scroll op 390px. CTA's altijd duim-bereikbaar. Branche-switcher wordt swipeable op mobiel.
- **Toegankelijkheid niet-onderhandelbaar.** WCAG 2.1 AA, 4.5:1 contrast, focus rings, prefers-reduced-motion gerespecteerd.

**Sfeerwoorden:** rustig, vakkundig, Nederlands, modern-tijdloos, gereedschap (niet speeltje).

**Referenties qua niveau (niet kopiëren, wel kalibreren):** Linear, Notion, Attio, Pitch, Vercel — maar dan in de Nederlandse zakelijke toon van bedrijven als Moneybird of Tellow.

---

## 5. Concrete uitvoering — wat ik wil bouwen

**Fase 1 — Fundament (deze sprint)**
1. Nieuwe designtokens in `index.css` + `tailwind.config.ts`: extra neutralen, display-font, schaduw-schaal, radius-schaal.
2. Nieuwe `Navbar` (5 items, mega-menu voor Product en Voor wie) en `Footer` (4 koloms + trustbar).
3. Nieuwe `HeroSection` met UI-screenshot i.p.v. fixed Unsplash-bg (LCP-fix).
4. Nieuwe homepage-secties: `TrustBar`, `ProblemSection`, `PillarsSection`, `BranchSwitcher`, `CaseStudySection` — vervangen huidige `ServicesSection`/`BenefitsSection`/`TestimonialsSection`.
5. `useDocumentSeo` toepassen op Home + alle bestaande publieke pagina's.

**Fase 2 — Content & SEO**
6. Vijf branche-landingen (`/voor/zonnepanelen` etc.) als één template-component met data-config.
7. Bestaande `/features/*` pagina's herschrijven volgens nieuw stramien (probleem → screenshot → quote → CTA).
8. `/kennisbank` skelet + 3 launch-artikelen (los content-traject).
9. Dynamische `sitemap.xml` via Edge Function.
10. JSON-LD: `SoftwareApplication`, `Organization`, `FAQPage`, `BreadcrumbList`.

**Fase 3 — Conversie & autoriteit**
11. Vergelijkingspagina-template + 2 launch-vergelijkingen.
12. Lead-magnets: ROI-calculator (kan via bestaande WebTools-infra) + e-mailcapture.
13. Klantverhalen-CMS (eenvoudige Supabase-tabel `klantverhalen` + publieke pagina).
14. A/B-test framework (PostHog of simpel via feature flag) op hero-CTA.

**Tech-aandachtspunten:**
- Geen `background-attachment: fixed` (slecht op mobiel + LCP).
- Hero-image: `<img>` met `fetchpriority="high"`, expliciete `width/height`, AVIF/WebP fallback.
- Code-splitting per route (al via React Router, checken dat website-routes lazy zijn).
- Lighthouse-budget: LCP <2.0s, CLS <0.05, INP <200ms.
- Bestanden ≤800 regels, componenten ≤50 regels per functie (workspace-regels).

---

## 6. Wat ik nog van je nodig heb voor we beginnen

1. Akkoord op de **vijf primaire branches** (zonnepanelen, warmtepompen, thuisbatterijen, isolatie, laadpalen) — of een andere selectie?
2. Akkoord op het **paars als hoofdkleur behouden** (`#5B58E1`) met natuurlijke neutralen eromheen, of liever een complete kleurreset?
3. Heb je **echte klantlogo's, reviews en cases** die ik mag gebruiken? Zo niet, bouw ik plaatsing met "logo komt hier" placeholders.
4. Mag ik direct met **Fase 1** starten (nieuwe homepage + designtokens + nav/footer), of wil je eerst nog moodboard-schetsen zien?
