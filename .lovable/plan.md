## Doel

Affiliate-leads verschijnen pas in de Pipeline (kolom "Nieuw" en verder) wanneer de affiliate ze actief "koopt" / activeert. De Leads-pagina blijft het complete overzicht van alle eigen leads — ongeacht of ze al in de pipeline zitten.

## Wat verandert

**1. Database (`affiliate_leads`)**

Nieuwe kolom: `in_pipeline boolean not null default false`.

Initiële migratie zet `in_pipeline = false` voor álle bestaande leads met status `'nieuw'` — zo verdwijnen ze uit de Pipeline en blijven ze zichtbaar op de Leads-pagina. Leads die al verder in de funnel staan (gebeld, gesprek gepland, in gesprek, voorstel, gewonnen, verloren) krijgen `in_pipeline = true`, zodat lopend werk niet onverwacht uit de pipeline verdwijnt.

Geen wijziging aan status-enum, RLS-policies of triggers.

**2. Hook `useAffiliateLeads`**

Extra scope toevoegen: `"pipeline"` → `eigenaar_id = user AND in_pipeline = true`.
- `AffiliatePipeline.tsx` gebruikt voortaan scope `"pipeline"`.
- `AffiliatePool.tsx` blijft `"mine"` gebruiken → toont nog steeds álle eigen leads.

Nieuwe mutation `useZetLeadInPipeline(id)`:
- Patcht `in_pipeline = true` (en, alleen als status `'nieuw'` is en lead nog geen status had buiten "nieuw", blijft status op `'nieuw'`).
- Optimistic update + invalidate.

`useClaimAffiliateLead` blijft puur claimen — zet `in_pipeline` níet automatisch op true. Pool → Leads → handmatige "Kopen"-knop → Pipeline.

**3. Leads-tab (`AffiliatePool.tsx`, tab "Aan mij toegewezen")**

- Extra kolom met knop **"Naar pipeline"** (label conform `mem://constraints` — neutrale, actiegerichte microcopy; "Kopen" suggereert betaling en past niet bij de bestaande UX).
- Knop is alleen zichtbaar wanneer `lead.in_pipeline === false`.
- Klik → `useZetLeadInPipeline(lead.id)` + toast "Lead toegevoegd aan pipeline".
- Voor leads die al `in_pipeline = true` zijn: kleine, neutrale badge "In pipeline" op dezelfde plek (geen knop).
- Filter `mijnActief` blijft ongewijzigd (toont gewonnen/verloren niet) — gebruiker zei expliciet dat álle leads zichtbaar moeten zijn, dus geen verdere statusfilters toevoegen.

**4. Pipeline (`AffiliatePipeline.tsx`)**

- Scope `"pipeline"` ophalen.
- Statistiekkaarten blijven werken op de zichtbare set (alleen leads die al in de pipeline staan).
- Geen verdere UI-wijziging; kanban, lijst, drag-and-drop blijven hetzelfde.

**5. Nieuwe lead aanmaken (`useCreateAffiliateLead` / `NieuweLeadDialog`)**

- Bij `_bestemming === "mine"` (handmatig aangemaakt vanuit Leads/Pool): `in_pipeline = true` zetten. Een handmatig aangemaakte lead is per definitie een actieve lead die de affiliate gaat bewerken.
- Bij `_bestemming === "pool"`: `in_pipeline = false` (default).
- Bij `NieuweLeadDialog` op `AffiliatePipeline`: nieuw aangemaakte lead direct `in_pipeline = true` (logisch, want de gebruiker maakt 'm aan vanaf de pipeline).

## Technische details

```text
Leads-tab (Pool/Mijn)              Pipeline
┌──────────────────────────┐       ┌────────────────────────┐
│ alle eigen leads (mine)  │       │ in_pipeline = true     │
│  ├─ in_pipeline=false →  │       │  status = nieuw/…/won  │
│  │   knop "Naar pipeline"│──┐    │                        │
│  └─ in_pipeline=true  →  │  │    │                        │
│      badge "In pipeline" │  └──► UPDATE in_pipeline=true  │
└──────────────────────────┘       └────────────────────────┘
```

- Migratie: één bestand met `ALTER TABLE … ADD COLUMN`, `UPDATE` voor backfill, `CREATE INDEX` op `(eigenaar_id, in_pipeline)` voor de Pipeline-query.
- Type-regeneratie loopt automatisch na migratie.
- `useAffiliateLeads` blijft binnen 1 hook-bestand (< 50 regels per functie).

## Buiten scope

- Partners (`leads`-tabel) — die hebben al de bestaande Kanban/pipeline-flow; verzoek gaat expliciet over affiliate-zijde.
- Cost/tellers voor "gekochte" leads — er wordt geen verbruik bijgehouden, alleen een boolean.
- Terug-uit-pipeline knop (kan later als reverse-actie worden toegevoegd).