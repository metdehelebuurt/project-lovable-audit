
# Redesign affiliate leaddetail

## Wat er nu mis is

1. **Horizontale overflow** — de pagina is breder dan het viewport, dus bij rechts-scrollen schuift de grijze hero-band onder/over de vaste sidebar (z-index/positioning conflict). Oorzaak: `AffiliateLeadDetail` heeft `max-w-[1400px]` zonder `min-w-0`/`overflow-x-hidden`, en de hero-actiebar met 5+ knoppen blaast op smalle laptops de breedte op.
2. **Visueel saai** — alles is wit/grijs op wit. Geen accentkleuren, geen ritme.
3. **Linker stapel te lang** — Sales kerngegevens + Hoofdcontact + Contactpersonen + Bedrijfsgegevens + Trial-CTA staan onder elkaar → ~1200px scroll vóór de gebruiker bij de tijdlijn is.
4. **Tabs zijn neutraal grijs** — geen visuele identiteit per tab, gebruiker weet niet waar hij is.
5. **E-mailtab is een ongesegmenteerde lijst** — geen onderscheid in/uit, geen preview.

## Nieuwe opbouw

```text
┌───────────────────────────────────────────────────────────────┐
│ HERO (compact, gekleurde accent-strip links)                  │
│  ▎ Esteban test BV          [Bel] [Mail] [WA]  [▾ Meer]       │
│  ▎ ● Nieuw  · 🔥 koud · 🏷 Eigen import · ⭐ AI —/100         │
│                                                               │
│  €1.234   ·   5 dgn stil   ·   0 mails   ·   3 contact        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│  ⏰ Volgende actie: do 27 jun  [+1d] [+1w] [klaar]            │
└───────────────────────────────────────────────────────────────┘

┌────────────── KLANTSTRIP (horizontaal, 3 kolommen) ───────────┐
│ 👤 Contact          🏢 Bedrijf          📊 Sales              │
│  T. de Jong          KvK 12345678        Status ▾             │
│  📞 06-…  ✉️ …       Amsterdam            Temp  ▾ Waarde €    │
│                      Bron · Sector       Volgende actie 📅    │
│  [bewerken]          [bewerken]          [opslaan]            │
└───────────────────────────────────────────────────────────────┘

┌─── TABS (gekleurd, met emoji-icoon) ──────────────────────────┐
│ 🔵 Tijdlijn  🟣 E-mail  🟡 Notities  ✨ AI-opvolging  🕘 Hist.│
└───────────────────────────────────────────────────────────────┘
        ↓
  Werkruimte = volledige breedte (geen smalle kolom meer)
```

### Hero — slanker, met linker accent-band
- Linkerrand 4px gekleurd op basis van temperatuur (koud=slate, lauw=amber, warm=orange, heet=rose).
- KPI's omgezet van 4 tegels naar één compacte inline-rij (`€ · stil · mails · contact`) met dividers → bespaart verticale ruimte.
- Actie-cluster ingekort: Bel/Mail/WhatsApp + één "Meer"-dropdown (Terugbel/Demo/Order/AI/Verrijken/Website).
- Trial-CTA verhuist naar de klantstrip (niet langer dubbel in sidebar + hero).
- "Volgende actie"-bar krijgt quick-shift chips (`+1d` / `+1w` / `Klaar`).

### Klantstrip vervangt linkerstapel
Nieuwe component `LeadKlantStrip.tsx` — één rij, drie cards naast elkaar (op `lg:` breekt naar 3 kolommen, op `md:` 2, mobiel stack):

| Card | Inhoud | Inline edit |
| --- | --- | --- |
| 👤 **Contact** | Hoofdpersoon + telefoon/email/WA chips; uitklappanel toont overige contactpersonen | "Bewerken" → `ContactpersoonDialog` |
| 🏢 **Bedrijf** | KvK · plaats · sector · bron · website | "Bewerken" → `BedrijfBewerkenDialog` |
| 📊 **Sales** | Status select · Temperatuur · Waarde · Volgende actie · Opslaan-knop · Trial-CTA wanneer geen partner | inline selects |

→ ~600px verticale ruimte bespaard t.o.v. de huidige sidebar-stapel.

### Tabs krijgen kleur en identiteit
Nieuwe component `GekleurdeTabsList.tsx`. Per tab een eigen accent (border-bottom + actieve achtergrond):

- `Tijdlijn` → indigo
- `E-mail` → purple (primary)
- `Notities` → amber
- `AI-opvolging` → emerald (sparkle-icoon animatie)
- `Historie` → slate

Active tab krijgt `bg-{accent}/10 text-{accent}-700 border-b-2 border-{accent}-500`, inactive `text-muted-foreground hover:bg-muted`. Iconen blijven `lucide`.

### E-mailtab modernisering (los kleinere `EmailTab`-wrapper)
- Splitsing in twee kolommen op `xl:`: lijst (40%) ↔ preview (60%).
- Item-rij: avatar (initialen), onderwerp **bold**, snippet `text-muted-foreground` (1 regel), datumbadge rechts, kleurpunt links (in=blue, uit=primary).
- Empty state: illustratie + CTA "Stuur eerste mail".

### Tijdlijn polish
- Tijdrail krijgt gekleurde bolletjes per type (call=blue, mail=purple, status=slate, AI=emerald).
- "Vandaag / Deze week / Eerder" date-headers.
- Inline composer plakt aan de bovenkant.

### Bugfix horizontale overflow
- `AffiliateLeadDetail` page wrapper: `w-full min-w-0 overflow-x-hidden` i.p.v. `max-w-[1400px]`.
- Grid in `LeadDetailBody` krijgt `min-w-0` op de children (fix voor flex/grid intrinsic min-content overflow).
- Hero-flex krijgt `min-w-0` op de titel-container + `truncate` op `h1` (al aanwezig, maar parent miste min-w-0).

## Bestandsstructuur (alles < 800 r., functies < 50 r.)

```text
src/components/affiliate/LeadDetail/
  Hero.tsx                       # herwerkt (slanker)
  LeadKlantStrip/
    index.tsx                    # <LeadKlantStrip />
    ContactCard.tsx
    BedrijfCard.tsx
    SalesCard.tsx
  GekleurdeTabsList.tsx          # nieuw
  Email/
    EmailLijstCompact.tsx        # nieuw, wrapped rond bestaande EmailTab data
  Tijdlijn/
    index.tsx                    # bestaand, kleine polish (date-headers)
```

`LeadDetailBody.tsx` blijft orchestrator, krimpt naar ~150 r. en verliest de hele linker `<aside>` (vervangen door klantstrip onder de hero).

## Datalaag

Geen DB-/RLS-wijzigingen. Alleen presentation-layer.

## Validatie

1. `bun run build` / `tsgo` clean.
2. Playwright op viewport **956×674** (de huidige laptopmaat van de gebruiker):
   - Geen horizontale scrollbar op `body`.
   - Hero past in beeld zonder overflow.
   - Tabs in één rij, gekleurd actief.
   - Klantstrip toont 3 kolommen.
3. Viewport 390×844 (mobiel): hero stackt, klantstrip stackt 1-koloms.

## Out of scope

- Geen schema-/RLS-/edge-function-wijzigingen.
- Geen wijziging aan AI-opvolg-logic of trial-flow.
- Sales-kant (`/sales/leads/:id`) ongewijzigd.
