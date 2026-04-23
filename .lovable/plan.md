# Platform v2.0 — Navigatie, IA & UX-fundering

Doel: het platform terugbrengen naar de oorspronkelijke belofte — eenvoudig, rol-gericht, en passend bij apparaat (desktop, tablet, mobiel) — terwijl het volume aan modules blijft groeien. Dit plan is opgeknipt in **6 werkpakketten** die los uitgerold kunnen worden, elk met eigen waarde.

---

## 1. Probleemanalyse (huidige situatie)

**Wat er is:**
- Sidebar (`AppSidebar.tsx`) met 9 vaste secties, deels role-aware maar erg lang (Overzicht → Relatiebeheer → Werkproces → Helpdesk → Financieel → Logistiek → Planning & Tools → Beheer → Support → Instellingen).
- Tweede navigatieparadigma via "Apps-view" (`/dashboard` → `AppsView`) met tegels, favorieten, mappen, drag-drop en spotlight-zoek — feitelijk een tweede menu.
- Dashboard zelf heeft eigen tegels + statkaarten + grafieken (`Dashboard.tsx`, 470 regels) die deels overlap hebben met sidebar én apps-view.
- Header heeft losse Actiecentrum-knop, NotificatieCenter en avatar-menu, maar geen globale zoek of taakcontext.
- 60+ pagina's, 9 rollen, vele cross-links (lead → schouw → offerte → opdracht → installatie → oplever) die nu via de sidebar of detailpagina's gevonden moeten worden.
- Mobiel: alleen offcanvas-sidebar; geen tab-bar, geen FAB, geen optimalisatie voor monteurs in het veld.

**Pijnpunten:**
1. **Drie concurrerende toegangspaden** (sidebar / apps-tegels / dashboard-tegels) zonder duidelijke hiërarchie — gebruikers raken het overzicht kwijt.
2. **Sidebar is rol-agnostisch in structuur**: een installateur ziet net zoveel groepen als een partner_admin; alleen de inhoud verschilt.
3. **Geen globale acties** ("nieuwe lead", "nieuwe offerte") buiten de relevante pagina — altijd eerst klikken naar module.
4. **Geen globale zoekfunctie** over leads/klanten/offertes/orders heen. Spotlight zoekt alleen apps.
5. **Mobiele werkstromen** voor adviseurs en monteurs gaan via dezelfde lay-out als desktop; geen bottom-nav, geen quick actions.
6. **Inconsistente entry-points**: Helpdesk en Financieel hebben sub-menu's, andere modules niet. Sommige tegels openen tabblad-querystrings (?tab=…), andere subpaden.
7. **Settings groeit hard** maar zit als één entry verstopt onderaan.

---

## 2. Ontwerpprincipes v2.0

1. **Eén navigatiemodel per rol, geen drie.** Sidebar = primair voor desktop, bottom-nav = primair voor mobiel, command-palette = secundair voor power-users. Apps-view (tegelraster) wordt de mobiele/tablet startpagina i.p.v. een tweede paradigma.
2. **Rol-eerst.** Voor iedere rol: een vaste set "kern" (max 5–6 items) + uitklapbare "meer". Wat een installateur zelden nodig heeft, zit niet in zijn vaste menu.
3. **Werkstromen zichtbaar maken.** Lead → Schouw → Offerte → Order → Installatie → Oplever wordt een herkenbare *flow*, met een statusbalk in de detailpagina én een "volgende stap"-knop.
4. **Globale acties altijd binnen één klik.** Quick-create knop in de header (⌘K of "+") werkt op elke pagina.
5. **Mobile-first voor veldrollen.** Adviseur en installateur krijgen op mobiel een eigen bottom-nav met max 5 items + FAB.
6. **Progressive disclosure.** Alleen tonen wat de gebruiker nu nodig heeft; geavanceerde dingen achter "Meer" / "Beheer".
7. **Consistente patronen.** Alle modules krijgen dezelfde layout-structuur: header (titel + acties) → filterbalk → lijst/board → detail-paneel/route. Geen aparte uitzonderingen.

---

## 3. Informatiearchitectuur — nieuw

**Drie hoofdcategorieën i.p.v. negen secties:**

```text
WERK              Wat je dagelijks doet
  ├─ Vandaag (actiecentrum + agenda)
  ├─ Inbox (berichten + notificaties)
  └─ Mijn module(s)         ← rol-bepaald, max 5

KLANT & VERKOOP   De volledige sales-cyclus
  ├─ Leads
  ├─ Klanten
  ├─ Offertes
  ├─ Orders
  └─ Schouwen

UITVOERING        Operatie & oplevering
  ├─ Planning
  ├─ Installaties
  ├─ Opleveringen
  └─ Voorraad / Retouren / Leveranciers
```

**Onder een "Meer"-knop** (in sidebar onderaan): Producten, Tools, Analytics, Documenten, Helpdesk, Kennisbank, Feedback, Affiliate, Abonnementen, Partners, Adviseurs, Gebruikers, Instellingen.

**Per rol** wordt bepaald welke categorieën überhaupt verschijnen:

| Rol | Werk | Klant & Verkoop | Uitvoering | Meer |
|---|---|---|---|---|
| superadmin | ✓ | ✓ | ✓ | ✓ (volledig + Beheer-kop) |
| partner_admin | ✓ | ✓ | ✓ | ✓ (+ Beheer + Analytics) |
| backoffice | ✓ | ✓ | ✓ | ✓ (Financieel + Leveranciers) |
| partner_staff | ✓ | ✓ | ✓ | ✓ (subset) |
| adviseur | ✓ | ✓ (Leads/Klanten/Offertes/Schouwen) | Planning | Tools, Producten |
| installateur | ✓ | — | ✓ (Installaties/Opleveringen/Planning) | Voorraad |
| consument | Mijn Woning | Mijn Offertes/Schouwen/Berichten | Mijn Planning | — |
| affiliate | — | — | — | Affiliate Links |

---

## 4. Werkpakketten

### WP1 — Nieuwe Sidebar (`AppSidebar v2`)

**Doel:** rol-gestuurde, 3-laags sidebar met vaste "Werk"-blok en uitklapbaar "Meer".

- Nieuwe data-bron `src/lib/navigation/navigationModel.ts` die per rol een tree teruggeeft (3 hoofdgroepen + flat "meer"-lijst). Eén bron voor sidebar, command palette én mobiele bottom-nav.
- `AppSidebar` herschrijven naar twee zones:
  - Bovenste vaste zone: Werk + Klant & Verkoop + Uitvoering (alleen items die voor de rol relevant zijn).
  - Onderste collapse "Meer" met de overige items, gegroepeerd onder kleine kopjes (Beheer, Tools, Support).
- Active-state, badges en collapsed-state behouden zoals nu (icon-only modus blijft).
- Bestaande `getNavGroups`-functie wordt verwijderd (of dunne wrapper rond het nieuwe model).

**Bestanden:** `src/lib/navigation/navigationModel.ts` (nieuw), `src/components/AppSidebar.tsx` (refactor, < 400 regels), `src/components/sidebar/SidebarSection.tsx` (uitgesplitst).

---

### WP2 — Globale Command Palette + Quick Create

**Doel:** ⌘K / Ctrl-K opent een palette met (a) navigatie, (b) globale zoek over leads/klanten/offertes/orders/installaties, (c) snelle acties ("Nieuwe lead", "Nieuwe offerte", "Plan afspraak").

- Bestaande `SpotlightZoek` (alleen apps) wordt gepromoveerd naar globaal `<CommandPalette />` in `AppLayout`.
- Tabs binnen palette: "Snelle acties" / "Ga naar" / "Zoek". Zoek raadpleegt parallel: `leads`, `klanten`, `offertes`, `opdrachten`, `installaties` met `ilike` op naam/nummer; max 5 per type.
- Header krijgt een `+ Nieuw` dropdown (rol-afhankelijk: lead/klant/offerte/schouw/afspraak) en een zoek-input die het palette opent.
- Keyboard shortcut globaal geregistreerd (⌘K op Mac, Ctrl-K op Windows).

**Bestanden:** `src/components/command/CommandPalette.tsx` (nieuw), `src/components/command/QuickCreateMenu.tsx`, `src/components/command/useGlobaleZoek.ts`. `AppHeader.tsx` aanpassen.

---

### WP3 — Mobile-first Bottom-nav + FAB

**Doel:** voor adviseur, installateur en consument een native-aanvoelend mobiel menu.

- Nieuwe `<MobileBottomNav />` (5 slots) die alleen onder `md:` getoond wordt, items rol-bepaald (zelfde model als WP1).
  - Adviseur: Vandaag · Leads · Schouwen · Offertes · Meer
  - Installateur: Vandaag · Mijn werk · Planning · Oplevering · Meer
  - Consument: Woning · Offertes · Berichten · Planning · Meer
- "Meer" opent een full-screen sheet met de overige items (de huidige offcanvas-sidebar wordt hier de inhoud van).
- Floating Action Button (rechtsonder, boven bottom-nav) met rol-afhankelijke primary action (adviseur: nieuwe lead; installateur: foto/checklist; consument: bericht naar partner).
- `AppLayout` past `pb-16 md:pb-0` toe wanneer bottom-nav actief is.
- Sidebar-trigger blijft als alternatief in header voor wie de volledige boom wil zien.

**Bestanden:** `src/components/mobile/MobileBottomNav.tsx`, `src/components/mobile/MobileFab.tsx`, `src/components/mobile/MobileMeerSheet.tsx`. `AppLayout.tsx` aanpassen.

---

### WP4 — Persona-dashboards (Vandaag-pagina)

**Doel:** vervang het huidige overladen `Dashboard.tsx` (470 regels, alle rollen door elkaar) door één gedeelde container met **rol-specifieke dashboard-modules**. Het Actiecentrum wordt geïntegreerd ipv aparte route.

- Nieuwe route `/vandaag` (alias /dashboard blijft bestaan voor backwards-compat, redirect naar `/vandaag`).
- Container `<VandaagPagina />` rendert op basis van rol een van: `<AdminVandaag />`, `<AdviseurVandaag />`, `<InstallateurVandaag />` (bestaande `MonteurDashboard.tsx` hergebruiken), `<ConsumentVandaag />`.
- Elke variant bestaat uit: groet + vandaag-stats + een actiecentrum-paneel + een "volgende stap"-stroom voor de openstaande items van die rol.
- Apps-view (tegelraster) blijft beschikbaar als secundaire view (toggle in header), maar is **niet meer de default**. Voor mobiel/tablet wordt apps-view automatisch de standaard zodat het als app-launcher fungeert.
- Charts worden uitgesplitst naar `<Analytics>` (ze hoorden daar al thuis) — Dashboard wordt rustiger.

**Bestanden:** `src/pages/Vandaag/index.tsx`, `src/pages/Vandaag/AdminVandaag.tsx`, `…/AdviseurVandaag.tsx`, `…/InstallateurVandaag.tsx`, `…/ConsumentVandaag.tsx`. `Dashboard.tsx` → wrapper of redirect.

---

### WP5 — Werkstroom-balk in detailpagina's

**Doel:** zichtbaar maken waar een lead/klant/offerte zich in de keten bevindt, en met één klik naar de volgende stap navigeren.

- Nieuw component `<WerkstroomBalk huidigeStap="…" entiteitId="…" />` dat onder de paginatitel verschijnt op `LeadDetail`, `KlantDetail`, `OfferteDetail`, `OpdrachtDetail`, `InstallatieDetail`, `OpleverDetail`.
- Toont 6 stappen (Lead → Schouw → Offerte → Order → Installatie → Oplever) als horizontale stepper; voltooide stappen klikbaar als deeplink, huidige gemarkeerd, toekomstige uitgegrijsd tot er actie nodig is.
- "Volgende stap" knop primair rechtsboven (bv. op offerte: "Maak verkooporder"). Acties komen uit een centrale `werkstroomActies(entiteit, status, rol)` helper.
- Alleen logisch tonen voor rollen die meerdere stappen zien; consument krijgt vereenvoudigde 3-stappen-balk.

**Bestanden:** `src/components/werkstroom/WerkstroomBalk.tsx`, `src/lib/werkstroom/werkstroomActies.ts`. Detail-pagina's krijgen één regel toevoeging.

---

### WP6 — UI-systeem aanscherpen

**Doel:** consistente patronen en visuele rust, zodat groei van modules niet leidt tot fragmentatie.

- **Pagina-template `<PageShell />`** met vaste slots: titel, omschrijving, primary-action, filterbalk, content. Alle lijst-pagina's (`Leads`, `Klanten`, `Offertes`, `Opdrachten`, `Installaties`, `Opleveringen`, `Voorraad`, `Retouren`, `Producten`, `Documenten`) migreren ernaartoe.
- **Lege staten** standaardiseren via `<LegeStaat icon titel beschrijving cta />`.
- **Filterbalk** standaardcomponent met chip-filters + search + sort, gebruikt op alle lijsten.
- **Densiteits-toggle** (compact/comfortabel) in profiel-instellingen, opgeslagen in `users.dashboard_view`-stijl preference.
- **Toegankelijkheid pass**: focus-states, aria-labels op icon-only buttons, tab-volgorde gecontroleerd, kleurcontrast WCAG AA gevalideerd.
- **Microcopy**: alle pagina-headers en CTA's nalopen op het "actie + object"-patroon ("Nieuwe offerte" i.p.v. "Toevoegen").

**Bestanden:** `src/components/shell/PageShell.tsx`, `src/components/shell/LegeStaat.tsx`, `src/components/shell/FilterBalk.tsx`. Bestaande lijst-pagina's worden refactored (gefaseerd, niet alles tegelijk).

---

## 5. Volgorde & uitrol

Iedere stap is een eigen mergeable batch. Stoppen na elke stap blijft een werkend product opleveren.

1. **WP1 (Sidebar v2) + WP2 (Command Palette)** — fundament; geeft direct overzicht en wint snelheid.
2. **WP3 (Mobile bottom-nav + FAB)** — onmisbaar voor adviseur/installateur in het veld.
3. **WP5 (Werkstroom-balk)** — koppelt modules logisch aan elkaar zonder schemawijzigingen.
4. **WP4 (Persona-dashboards / Vandaag)** — herschrijft Dashboard.tsx en integreert Actiecentrum.
5. **WP6 (UI-systeem)** — gefaseerde refactor van lijst-pagina's; eerst PageShell + LegeStaat + FilterBalk, dan migratie pagina-per-pagina.

Geen DB-wijzigingen nodig in WP1–WP5. WP6 voegt optioneel één gebruikers-preference toe (densiteit).

---

## 6. Wat blijft buiten scope (bewust)

- Functionele wijzigingen in modules zelf (lead-pipeline, schouw-wizard, offerte-PDF, etc.) — dit plan gaat puur over **navigatie, IA en UI-fundering**.
- Migreren naar een nieuw kleurensysteem of typografie. Bestaande tokens blijven; we kalibreren alleen densiteit.
- Backend-restructuring of nieuwe rollen — alleen presentatie van bestaande rollen.

---

## 7. Vraag voor akkoord

Het plan is gefaseerd zodat je per werkpakket kunt beslissen. Geef aan:

- Akkoord op de IA (3 hoofdcategorieën + "Meer" + rol-tabel in §3)?
- Volgorde WP1 → WP6 oké, of liever eerst mobiel (WP3) of eerst Vandaag-pagina (WP4)?
- Mag het Actiecentrum opgaan in `/vandaag` (WP4), of liever als eigen route blijven?

Zodra dit akkoord is, start ik met **WP1 + WP2** in de eerstvolgende build-stap.