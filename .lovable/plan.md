
## Huidige pijnpunten (uit screenshot + code)

- Kaarten zijn ~120px hoog met enorm veel verticale lucht; één scherm toont ~6 items terwijl er ruimte is voor 12+.
- Rechterhelft van het scherm is leeg — content stopt rond 1000px terwijl viewport 1700px+ is.
- "Meer tonen" verbergt juist de relevante info (beschrijving, admin-reactie, bijlagen) — gebruiker moet per item klikken.
- Status, categorie en type-icoon staan los van elkaar; geen kleurcodering voor status (alles "outline").
- Geen zicht op opvolging: geplande release-versie (`verwacht_klaar_op`, `verwerkt_in_versie`), bevestiging (`bevestiging_status`), CSAT (`csat_score`), aantal reacties, of of er al een admin-reactie is.
- Datum is weggestopt onderaan in muted 10px tekst.
- Filters (type + status) staan los; geen tellingen, geen zoek, geen sortering.

## Scope

Alleen de UX/UI van de feedback-module voor gewone gebruikers (`src/pages/FeedbackOverzicht.tsx` + `src/components/feedback/FeedbackKaart.tsx`). Geen wijziging aan RLS, data-model, edge functions, of de admin-pagina `FeedbackAdmin.tsx`. Detail-pagina blijft functioneel hetzelfde.

## Redesign

### 1. Layout-shell

- Vervang single-column `space-y-3` door **2-koloms grid op ≥xl** (`grid-cols-1 xl:grid-cols-2 gap-4`). Tegels worden compacter en de rechter helft van het scherm wordt gevuld zonder dat individuele kaarten breed-en-leeg worden.
- Header krijgt links titel + sub, rechts: zoekveld (titel/beschrijving full-text op client), type-filter, status-filter, sort (Nieuwste/Meeste stemmen), "Nieuw verzoek".
- Filterchips met **tellingen** per status: `Nieuw 4 · In behandeling 2 · Gepland 1 · Afgerond 8` — klikbaar als snelfilter naast het Select-dropdown.

### 2. Postcard (FeedbackKaart, herontworpen)

Compacte kaart in 3 stroken (geen "Meer tonen" meer — relevante info staat al in de kaart):

```text
┌──────────────────────────────────────────────────────────┐
│ [▲ 12]  🐛 Bug · Workflow              [Status pill]      │  ← header strook
│         Verwijderen van leads uit pijplijn               │
│         De gebruiker wenst de mogelijkheid om leads…     │  ← 2-regel clamp samenvatting
│                                                          │
│ 🏷 leads  verwijderen  pijplijn-mgmt   +2                │  ← tags max 3 + "+n"
│                                                          │
│ 📅 23 jun · 🗓 v2.4 (verwacht 30 jun) · 💬 3 · ⭐ 4/5    │  ← meta-strook
└──────────────────────────────────────────────────────────┘
```

Concreet:
- **Stem-knop** links: pijl-omhoog ikoon + getal (groter, primary-kleur als gestemd), niet meer disabled-grijs voor eigen item maar verborgen en vervangen door 👤 "Door jou"-badge.
- **Type + categorie**: één rij met domein-icoon (bug/lightbulb/message), categorie-chip + status-pill **met semantische kleur** (`nieuw`=blue, `in_behandeling`=amber, `gepland`=violet, `afgerond`=green, `afgewezen`=muted). Status pill rechts uitgelijnd.
- **Titel** medium-bold 14px, één regel met truncate.
- **Samenvatting** `ai_samenvatting` (fallback `beschrijving` als plain text) 2-regel clamp (`line-clamp-2`), 13px muted.
- **Tags-strook**: max 3 chips zichtbaar, overflow als `+n`. Wordt overgeslagen als geen tags.
- **Meta-strook** (12px muted, gescheiden door `·`):
  - 📅 ingediend-datum (`23 jun`)
  - 🗓 Indien `verwerkt_in_versie`: `v{versie}`; anders indien `verwacht_klaar_op`: `verwacht {datum}` — alleen tonen voor status `gepland`/`in_behandeling`.
  - 💬 aantal reacties (count via aparte query `feedback_reacties` group-by feedback_id, zie sectie 4).
  - ⭐ CSAT score `csat_score`/5 als afgerond + score aanwezig.
  - 📎 indien `bijlagen.length > 0`: aantal bijlagen.
  - "Door jou" badge als eigen item.
- **Actie-bevestiging hint**: indien `status='afgerond'` én `bevestiging_status` is `null` én eigen item → kleine inline call-to-action onderaan kaart: "✅ Bevestig of probeer opnieuw" — link naar detail. Trekt direct aandacht voor opvolging.
- **Klik op kaart** opent altijd `/feedback/${id}` (de detail-pagina); de aparte superadmin-redirect verdwijnt uit de gebruikersweergave.

### 3. Tonen van beschrijving zonder uitklap

`ai_samenvatting` (al door AI gegenereerd, één regel) is de primaire korte versie. Volledige beschrijving + bijlagen + admin-reactie staan in de detail-pagina — daar zijn ze rijker en met reacties-thread. De inline accordion `Meer tonen` vervalt: kaart blijft kort, klik = detail.

### 4. Reactie-tellingen ophalen

Eén extra query parallel aan de hoofdquery:
```ts
supabase.from('feedback_reacties').select('feedback_id').eq('intern', false)
```
Client-side reducen tot `Record<feedback_id, count>` en doorgeven aan de kaart. Geen schema-wijziging.

### 5. Lege staat + loading

- Loading: 6 skeleton-kaarten in dezelfde grid (niet meer alleen "Laden…").
- Lege staat: illustratie + tekst "Nog geen feedback" + duidelijke primary-knop "Nieuw verzoek".
- Gefilterde lege staat: "Geen resultaten voor deze filters" + "Filters wissen" knop.

### 6. Bestanden

- **Edit** `src/pages/FeedbackOverzicht.tsx`: nieuwe header, filterbalk met zoek/sort/tellingen, 2-koloms grid, reactie-count query, skeleton/lege staat.
- **Edit** `src/components/feedback/FeedbackKaart.tsx` (bestaat al, 143 regels): vervang body door nieuwe compacte 3-stroken layout. Houd dezelfde props-shape; voeg props toe voor `reactieCount`, en behoud `compact`-variant indien aanwezig.
- **Niet** wijzigen: detail-pagina, nieuwe-verzoek-pagina, admin-pagina, kanban, notificatie-log, RLS.

### 7. Status-kleuren als design-tokens

Voeg semantische tokens toe in `src/index.css` (HSL):
- `--feedback-status-nieuw`, `--feedback-status-behandeling`, `--feedback-status-gepland`, `--feedback-status-afgerond`, `--feedback-status-afgewezen`
en bijbehorende `-foreground` paren, geregistreerd in `tailwind.config.ts`. Geen hardcoded `bg-blue-500` in componenten — alles via tokens, conform project knowledge.

### 8. Responsive

- `<md`: 1 kolom, stem-knop blijft links, meta-strook wrapt; tags max 2 + `+n`.
- `md–xl`: 1 kolom maar bredere kaart (zelfde layout).
- `≥xl`: 2 kolommen grid.

## Wat valideer ik na implementatie

1. `tsgo` + `bun run build`.
2. Playwright: navigeer naar `/feedback`, screenshot op 1741×1249 viewport, controleer dat (a) twee kolommen zichtbaar zijn, (b) status-pill kleur heeft, (c) reactie-count en datum-meta tonen, (d) geen "Meer tonen" knop meer aanwezig is.
3. Klik op kaart → opent detailpagina.
