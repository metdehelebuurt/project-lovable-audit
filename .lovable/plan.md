# Plan: Affiliate lead-/klantdetail professionaliseren

## Probleemanalyse (huidige situatie)

Op basis van de screenshot en `LeadDetailBody.tsx` (422 r.):

- **Veel witruimte rechts**: de Activiteit-tab toont alleen een leeg gespreksnotitie-formulier en een grijze "nog niets gelogd"-regel — de rest van het paneel is leeg.
- **Sticky header oogt rommelig**: 9 knoppen op één rij (Bel/WhatsApp/Mail/Terugbel/Demo/Order/AI-opvolging/Verrijken/Trial) zonder hiërarchie; primaire CTA's verzuipen.
- **Geen kerncijfers in beeld**: waarde, AI-score, dagen sinds laatste contact, deadline volgende actie en aantal contactmomenten staan verspreid of ontbreken.
- **Hoofdcontact-kaart toont placeholders**: "test" als telefoonnummer ziet er stuk uit; geen één-klik bel/mail/WhatsApp-actie op contactrijniveau zelf.
- **Bedrijfsgegevens-kaart vaak leeg** (alleen "Bron: Eigen import" zichtbaar) → toont geen empty state of CTA om te verrijken.
- **Vier tabs (Overzicht / Activiteit / E-mail / Notities / Opvolging / Historie) overlappen**: AI-opvolging staat zowel op Overzicht als op Opvolging; contactmomenten staan op Activiteit maar e-mail/opvolg-log/historie elders → geen unified timeline.
- **Geen indicatie van trial-status / klant-conversie** wanneer lead → klant is geworden, behalve een kleine badge.
- **Mobile**: sticky header met 9 knoppen scrollt horizontaal en wordt onbruikbaar.

## Doelen

1. Eén oogopslag = situatie begrepen (status, waarde, hot/koud, volgende actie, dagen stil).
2. Eén klik = volgende beste actie (bel, mail, terugbel inplannen, trial starten).
3. Eén tijdlijn = alles wat ooit gebeurde (gesprekken, mails, opvolg-acties, status-mutaties).
4. Lege staten zijn nooit gewoon "Nog niets" — altijd een suggestie/CTA.
5. Strakker, rustiger, professioneler ogend (klantgericht, geen rommelige knoppenrij).

## Nieuw layout-model

```text
┌─────────────────────────────────────────────────────────────────┐
│ HERO                                                            │
│  Esteban test BV   [● Hot] [Nieuw – Koude leads] [⭐ AI 72/100] │
│  Eigen import · KvK 12345678 · Amsterdam · sinds 12 dgn         │
│                                                                 │
│  ┌─KPI─┐  ┌─KPI─┐  ┌─KPI─┐  ┌─KPI─┐                             │
│  │€1.234│ │ 5d  │ │ 0   │ │ 3   │  [Bel] [Mail] [WhatsApp]      │
│  │waarde│ │ stil│ │mails│ │cont.│  · · ·  [▾ Meer acties]       │
│  └─────┘ └─────┘ └─────┘ └─────┘                                │
│                                                                 │
│  Volgende actie: ⏰ Donderdag 27 jun — "Demo inplannen"         │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────┐ ┌─────────────────────────────────────────────┐
│ LINKER (320px)  │ │ RECHTER (workspace)                         │
│ • Sales kern    │ │  [Tijdlijn] [E-mail] [Notities] [Bedrijf]   │
│   (status/temp/ │ │                                             │
│    waarde/      │ │  Tijdlijn = samengevoegd:                   │
│    deadline)    │ │   • Gespreks-notitie                        │
│ • Snel loggen   │ │   • Verzonden/ontvangen mail                │
│   (1-klik)      │ │   • Status-wijziging                        │
│ • Hoofdcontact  │ │   • AI-opvolg suggestie                     │
│ • Contactperso- │ │   • Terugbelafspraak                        │
│   nen           │ │   • Trial gestart                           │
│ • Trial/Klant   │ │  Met filterchips: Alles · Calls · Mail ·    │
│   blok          │ │   AI · Status                               │
└─────────────────┘ └─────────────────────────────────────────────┘
```

## Concrete wijzigingen

### 1. Nieuwe Hero (`LeadDetailHero.tsx`)
- Bedrijfsnaam (XL), inline pillrij (status, temperatuur, AI-score, trial/klant-badge).
- Sub-regel: bron · KvK · plaats · "aangemaakt X dgn geleden".
- **KPI-strip** (4 tegels): Waarde €, Dagen stil (laatste contactmoment), # E-mails, # Contactmomenten + indicator volgende-actie deadline (groen/oranje/rood).
- **Actie-cluster**: primair (Bel · Mail · WhatsApp), secundair gegroepeerd in dropdown "Meer acties" (Terugbel, Demo plannen, Order, Verrijken, AI-opvolging).
- "Volgende actie"-bar onder KPI's met inline date-edit en quick-shift (+1d / +1w / klaar).
- Verwijdert de huidige drukke knoppenrij; alles via primair + dropdown.

### 2. Linkerkolom inkrimpen (`LeadDetailSidebar.tsx`)
- Collapsibles per blok (kerngegevens default open, rest dicht).
- **Snel-loggen-blok** verplaatsen naar de sidebar als 1-klik chips: 📞 Belpoging · 🗣️ Gesproken · 📧 Mail gestuurd · 🚫 Niet bereikbaar → opent compacte popover voor notitie + uitkomst en logt direct.
- Hoofdcontact: bel/mail/WhatsApp-icoonknoppen rechtstreeks op de regel.
- Bedrijfsgegevens met **lege-staat-CTA**: "Geen extra data — Verrijk met AI" (i.p.v. de huidige bijna-lege kaart).

### 3. Unified Timeline (`LeadActiviteitenTijdlijn.tsx`) — vervangt `Activiteit`+`Overzicht`-tabs
- Eén `useLeadTijdlijn(leadId)`-hook die samenvoegt:
  - `affiliate_lead_contactmomenten` (bestaand)
  - `affiliate_opvolg_log` (bestaand)
  - `email_messages` voor deze lead (bestaand via EmailTab)
  - `entiteit_historie` (status/temperatuur/eigenaar mutaties)
  - Terugbelafspraken
- Render als verticale timeline met type-icoon, datum, actor, samenvatting, expand voor detail.
- **Filterchips boven**: Alles · Calls · Mail · AI · Status · Notities.
- **Inline composer** bovenaan (zoals de huidige "Gespreksnotitie loggen") maar slanker + type-selector (telefoon/whatsapp/notitie/mail-handmatig).
- Lege staat: ascii-illustratie + 2 CTA's ("Eerste gesprek loggen", "Mail sturen").

### 4. Tabs hervormen
Van 6 → 4 tabs (alles wat dubbel was wordt samengevoegd):

| Oude tab | Nieuwe locatie |
| --- | --- |
| Overzicht (AI + opvolg-log) | Onderdeel van **Tijdlijn** (filter "AI") + sidebar-blok "Opvolgsuggestie" bovenaan |
| Activiteit | → **Tijdlijn** |
| E-mail | **E-mail** (blijft) |
| Notities | **Notities** (blijft, met markdown-toolbar mini) |
| Opvolging | → AI-kaart bovenaan tijdlijn + sidebar |
| Historie | → tijdlijn-filter "Status" |

### 5. Klant-modus (na trial-start)
- Wanneer `gewonnen_partner_id` gezet is: hero krijgt extra "Klant sinds dd-mm"-badge + trial-countdown progressbar.
- Trial CTA-blok in sidebar wordt **klantblok**: trial-status, einddatum, link naar partner-dashboard, MRR-indicatie als beschikbaar.

### 6. Mobile
- Hero KPI's stacken 2x2; actie-cluster wordt een sticky bottom-bar (Bel · Mail · ⋯).
- Linkerkolom wordt boven workspace gestapeld, collapsibles standaard dicht behalve "Sales kern".

### 7. Lege-staten standaardiseren
- Component `LegeStaatBlok` (icoon + titel + subtitel + CTA) wordt op 4 plekken hergebruikt (tijdlijn, e-mail, bedrijfsgegevens, contactpersonen).

## Bestandsstructuur (alles ≤ 800 r., functies ≤ 50 r.)

```text
src/components/affiliate/LeadDetail/
  Hero/
    index.tsx              # <LeadDetailHero />
    KpiTegels.tsx
    ActieCluster.tsx
    VolgendeActieBar.tsx
  Sidebar/
    index.tsx              # <LeadDetailSidebar />
    SalesKernBlok.tsx      # bestaande velden, ingekort
    SnelLoggenBlok.tsx     # NIEUW: 1-klik logging
    HoofdcontactBlok.tsx
    KlantTrialBlok.tsx
  Tijdlijn/
    index.tsx              # <LeadActiviteitenTijdlijn />
    TijdlijnItem.tsx
    TijdlijnFilters.tsx
    TijdlijnComposer.tsx
    useLeadTijdlijn.ts     # samenvoegende hook
  LegeStaatBlok.tsx        # gedeeld
  ContactpersonenKaart.tsx # bestaand, kleine polish
  BedrijfsKaartUitgebreid.tsx # bestaand, empty-state-CTA toevoegen
```

`LeadDetailBody.tsx` wordt orchestrator (< 150 r.), bevat alleen layout + Tabs.

## Datalaag (geen schemawijzigingen)

Alle data bestaat al:
- `affiliate_leads`, `affiliate_lead_contactmomenten`, `affiliate_opvolg_log`, `email_messages`, `entiteit_historie`, `affiliate_lead_contactpersonen`, `terugbel_afspraken`.

Nieuwe hook `useLeadTijdlijn(leadId)` voert 5 parallelle queries uit (`Promise.all` in queryFn) en mergt op `created_at` desc. Geen RLS-wijzigingen nodig — alles is al per affiliate gescoped.

## Visueel/design

- Pas bestaande semantische tokens toe (purple primary, `--muted`, `--accent`).
- Statusbadges: behoud `STATUS_KLEUR` mapping; KPI-tegels via `bg-muted/40` + `border`.
- Geen nieuwe kleuren; alleen ritme/spacing verbeteren (gap-3 ↔ gap-5 consistent, kaarten p-4, hero p-5).
- Iconen via `lucide-react` (PhoneCall, MailPlus, Timer, Activity, TrendingUp, Zap).
- Tijdlijn: links 28px-rail met type-icoonbol + horizontale lijn naar kaart, in pure Tailwind.

## Validatie

1. `tsgo` + `bun run build` clean.
2. Playwright (1741×1249) op `/affiliate/leads/<id>?tab=tijdlijn`:
   - Hero KPI's zichtbaar.
   - Primaire actiebar < 4 knoppen + dropdown.
   - Tijdlijn toont gemixte items (mail + contactmoment + status).
   - Lege-staat-CTA op een lead zonder activiteit.
3. Viewport 390×844 voor mobile sanity-check (sticky action-bar onderaan).

## Out of scope (expliciet)

- Geen schema/RLS-wijzigingen.
- Geen edge-functie-aanpassingen.
- Geen wijziging aan e-mail-sync, AI-opvolg-edge-function, of trial-start-flow — alleen presentation-layer.
- Sales-kant (`/sales/leads/:id`) blijft ongewijzigd.
