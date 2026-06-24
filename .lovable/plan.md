## Doel

Maak de feedback-module krachtiger voor jou als platformbeheerder: betere statusafhandeling met een Kanban-pipeline, een terugkoppelloop met de indiener ("werkt het zoals bedoeld?"), zichtbaarheid van wie iets heeft ingestuurd, archivering en een aantal extra verbeteringen.

## Wat er nu mist / niet goed werkt

- **Lijstweergave toont geen indiener.** Pas in detailpagina is te zien wie iets heeft ingestuurd.
- **Geen Kanban / pipeline.** Alleen een platte lijst met dropdown-filter op status. Statussen verschuiven gaat per detailpagina.
- **Afgeronde feedback blijft in beeld.** Geen archief, geen "verberg afgehandeld"-modus.
- **Geen feedback-loop na oplevering.** Indiener krijgt wel een mail bij statuswijziging, maar kan niet terugkoppelen of het écht werkt zoals bedoeld.
- **Geen interne notities / threaded gesprek.** Alleen één veld `admin_reactie` dat naar de indiener gaat. Geen plek voor interne discussie of meerdere reacties over tijd.
- **Geen koppeling tussen feedback en uitgevoerd werk.** Geen versie/release-veld, geen "verwerkt in versie X".
- **Geen sortering of zoeken.** Alleen 2 dropdowns; geen tekstzoek, geen sortering op datum/prioriteit.
- **Stemmen-feature is geïmplementeerd maar onzichtbaar voor admin** — geen filter "populair" of indicatie wie heeft gestemd.
- **Geen bulk-acties.** Niet meerdere items tegelijk afsluiten/archiveren.
- **Geen due-date / planning.** Status "Gepland" zegt niks over wánneer.

## Plan — wijzigingen

### 1. Database — nieuwe velden & tabel

Op `feedback_verzoeken`:
- `gearchiveerd` (boolean, default false) — verbergt uit standaard overzicht.
- `verwacht_klaar_op` (date, nullable) — planningsdatum.
- `verwerkt_in_versie` (text, nullable) — bv. "v2.41" / "release 24-06".
- `bevestiging_status` (text, nullable) — `wachten_op_indiener` / `bevestigd_werkt` / `werkt_niet` / `deels`.
- `bevestiging_opmerking` (text, nullable) — toelichting van indiener.
- `bevestiging_op` (timestamptz, nullable).

Nieuwe tabel `feedback_reacties` voor een threaded gesprek tussen admin en indiener (1 record per bericht), plus losse `intern` boolean voor interne notities.

Nieuwe tabel `feedback_stemmen` (user_id + feedback_id, uniek) zodat we zien wíe heeft gestemd en dubbel stemmen voorkomen.

RLS:
- Indiener ziet eigen reacties (niet de interne) en kan zelf reageren + bevestigingsstatus zetten.
- Superadmin ziet en doet alles.
- GRANTs voor `authenticated` en `service_role` op alle 3 tabellen.

### 2. Admin overzicht — pipeline + lijst

`FeedbackAdmin.tsx` herbouwen met twee weergaven (tabs):

**Kanban-pipeline** (default): kolommen `Nieuw → In behandeling → Gepland → In review (wacht op bevestiging indiener) → Afgerond → Afgewezen`. Drag-and-drop tussen kolommen werkt status bij + triggert `feedback-notify`. Bij sleep naar `Afgerond` zet ook `bevestiging_status = wachten_op_indiener` en stuurt automatisch de "werkt het?"-mail.

**Lijstweergave**: huidige lijst, uitgebreid met:
- Indienernaam + partner zichtbaar op de kaart (avatar + naam).
- Bevestiging-badge (groen ✓ bevestigd / rood ✗ werkt niet / amber ⏳ wacht).
- Tekstzoekvak (titel + beschrijving + indienernaam).
- Sortering: datum / prioriteit / stemmen / laatste activiteit.
- Switch "toon gearchiveerd" (default uit). Afgerond + bevestigd = na 14 dagen automatisch verbergen tenzij switch aan.
- Bulk-selectie checkboxes met acties: archiveer / wijs prioriteit toe / wijs status toe.

KPI-kaarten bovenaan uitbreiden: `Wacht op mij` (nieuw + in behandeling), `Wacht op indiener` (in review), `Deze week gepland`, `Open bugs`.

### 3. Feedback-loop met indiener

Nieuwe status `in_review` (toegevoegd aan `statusOptions` overal).

Wanneer admin status naar `afgerond` of `in_review` zet:
- Edge function `feedback-notify` stuurt mail "Je verzoek is verwerkt — werkt het zoals bedoeld?" met 3 knoppen die deeplinken naar de feedback-detailpagina van de indiener met query-param actie. Mail-template `feedback-verzoek-bevestiging`.
- In-app notificatie met dezelfde call-to-action.

Op `FeedbackDetail` voor de indiener (rol = niet superadmin) verschijnt een blok met:
- "Werkt deze functie zoals bedoeld?" — knoppen Ja / Deels / Nee + toelichting verplicht bij Nee/Deels.
- Resultaat schrijft naar `bevestiging_status` + `bevestiging_opmerking` + maakt nieuwe `feedback_reacties`-rij aan.
- Bij "Nee" of "Deels": status van het verzoek springt automatisch terug naar `in_behandeling` en superadmin krijgt mail + in-app notificatie "Indiener meldt dat het niet werkt".

### 4. Reacties / gesprek

Op de detailpagina vervangt een gesprekspaneel het enkele `admin_reactie`-veld:
- Chronologische lijst van `feedback_reacties` (indiener + admin door elkaar, met afzender-naam).
- Tab "Intern" voor admin-only notities (`intern = true`, niet in mail).
- Mail naar indiener wordt alleen verstuurd voor publieke reacties.

Bestaande `admin_reactie`-kolom blijft als laatste publieke reactie, maar de waarheid leeft in `feedback_reacties`.

### 5. Detail — kleine verbeteringen

- Indiener-blok: voornaam + achternaam + rol + partner + "x eerdere verzoeken" link.
- Veld "Verwacht klaar op" (date picker) en "Verwerkt in versie" (text) in de zijkolom.
- Knop "Archiveer" naast "Opslaan".
- Activiteitslogboek (nieuwe reactie, statuswijziging, bevestiging) onderaan — uit bestaande `feedback_reacties` + bestaande notificatielog.

### 6. Extra functies die ik aanraad

- **AI-duplicaatdetectie bij indienen** — embeddings vergelijken met bestaande verzoeken; bij hoge match: "Lijkt op #123, wil je daarop stemmen i.p.v. nieuw indienen?". Verlaagt ruis.
- **Roadmap-deelweergave** voor alle gebruikers: alleen items met status `gepland` / `in_review` / `afgerond` van laatste 90 dagen, read-only — vergroot vertrouwen "er gebeurt iets met mijn feedback".
- **Mention-systeem in interne notities** — `@gebruiker` taggen (zelfde patroon als lead-notities). Stuurt in-app notificatie.
- **Auto-archivering** — afgerond + bevestigd_werkt + 14 dagen oud → automatisch gearchiveerd via dagelijkse cron.
- **CSAT op bevestiging** — bij "werkt zoals bedoeld" optioneel 1–5 sterren over de afhandeling (komt in superadmin-dashboard).

## Technische details

```text
DB
├─ feedback_verzoeken          → +6 kolommen
├─ feedback_reacties (nieuw)   id, feedback_id, user_id, bericht (html), intern (bool), created_at
└─ feedback_stemmen  (nieuw)   user_id + feedback_id (unique)

Edge functions
├─ feedback-notify             → uitbreiden met event "bevestiging_gevraagd" + "indiener_meldt_probleem"
└─ feedback-auto-archive       → nieuwe cron-functie (dagelijks)

Frontend
├─ FeedbackAdmin/
│  ├─ index.tsx                → tabs Kanban / Lijst
│  ├─ KanbanBoard.tsx          → 6 kolommen, drag-and-drop
│  ├─ FeedbackKaart.tsx        → kaart-component (gedeeld)
│  ├─ Filters.tsx              → zoek + sort + filters + toggle archief
│  └─ BulkActieBalk.tsx
├─ FeedbackDetail.tsx          → gespreksthread + bevestigingsblok + planning-velden
└─ feedback/
   ├─ BevestigingBlok.tsx      → indienerzijde "werkt het?"
   ├─ ReactiesThread.tsx       → chat-achtige weergave
   └─ FeedbackNotificatieLog.tsx (bestaand)

Templates
└─ feedback-verzoek-bevestiging  → "werkt het zoals bedoeld?" mail
└─ feedback-niet-werkend         → mail naar admin als indiener "nee" meldt
```

Stricte regels uit project-knowledge worden gerespecteerd: max 800 regels per file → `FeedbackAdmin` wordt opgesplitst, Dutch UI, purple primary, RichTextEditor + DOMPurify-rendering blijft, GRANTs op alle nieuwe public tabellen.

## Wat ik nog wil weten voor ik begin

1. **Kanban vs lijst als default?** Ik stel Kanban voor maar lijst blijft beschikbaar — akkoord?
2. **Auto-archiveren na 14 dagen** — oké of liever handmatig?
3. **Roadmap-pagina voor eindgebruikers** — moet die nu mee of houden we 'm voor later?
4. **Mention-systeem in interne notities** — moet dat nu mee of later?
