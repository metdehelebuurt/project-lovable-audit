## Doel

Een nieuwe module **Sales** in het hoofdmenu, **uitsluitend zichtbaar voor superadmin** (platformbeheerder). Hierin beheer je koude en warme prospects en zet je ze door naar affiliates — óf direct toegewezen aan één affiliate, óf in de bestaande affiliate-pool waar de eerste claimer 'm krijgt. De affiliate ziet de doorgezette lead direct in hun bestaande dashboard (pipeline / "Pool" / "Mijn klanten").

We hergebruiken de bestaande tabel `affiliate_leads` (met `eigenaar_id` en pool-logica) en breiden hem uit met sales-velden. Geen aparte parallelle CRM-tabel — dat geeft één bron van waarheid en de affiliate-flows blijven werken.

## Wat je krijgt als platform admin

### 1. Navigatie
- Nieuw menu-item **Sales** (superadmin-only, alleen onder rol-check, niet via configurable module).
- Subnavigatie:
  - **Pipeline** (kanban)
  - **Alle leads** (tabel met filters + bulk-acties)
  - **Import** (CSV)
  - **Analytics** (conversie per fase, per affiliate, per bron)

### 2. Pipeline (kanban)
Fases:
`koud` → `benaderd` → `warm` → `gekwalificeerd` → `doorgezet` → `gewonnen` / `verloren`

- Drag & drop tussen fases
- Kaart toont: bedrijfsnaam, contact, branche, regio, geschatte waarde, eigenaar (affiliate of "platform"), AI-score badge
- Klik = detailpaneel met notities, contactmomenten, historie, doorzet-knop

### 3. Lead-detail
- Bewerken van alle velden
- **Doorzetten naar affiliate** (modal):
  - Optie A: *Direct toewijzen* — kies affiliate uit dropdown (zoekbaar, alleen actieve affiliates)
  - Optie B: *In pool plaatsen* — alle affiliates zien 'm en kunnen claimen
  - Optioneel: notitie meesturen, deadline voor opvolging
- Contactmomenten loggen (hergebruik bestaande `affiliate_lead_contactmomenten`)
- Volledige historie

### 4. Alle leads (tabel)
- Filters: fase, eigenaar (platform / specifieke affiliate / pool), bron, branche, regio, AI-score, datumbereik
- Bulk-acties: doorzetten (naar pool of 1 affiliate), fase wijzigen, taggen, verwijderen, exporteren
- Snelzoek op bedrijfsnaam/contact/email/telefoon

### 5. CSV-import met auto-mapping
- Upload CSV → preview eerste 5 rijen
- Auto-mapping op kolomnaam (case-insensitive, accent-tolerant). Herkent o.a.:
  - bedrijfsnaam / company / organisatie / naam → `bedrijfsnaam`
  - contactpersoon / contact / aanspreekpunt → `contactpersoon`
  - email / e-mail / mail → `email`
  - telefoon / phone / tel / mobiel → `telefoon`
  - branche / sector / industrie → `branche`
  - regio / plaats / stad / locatie → `regio`
  - website / url / site → `website`
  - notitie / opmerking / omschrijving → `notities`
  - geschatte waarde / waarde / value / budget → `geschatte_waarde`
- Niet-herkende kolommen handmatig mappen via dropdown
- Bestemming kiezen vóór import: *Sales-pipeline (eigenaar = platform)*, *Affiliate-pool*, of *Direct toewijzen aan affiliate X*
- Standaard-fase kiezen (default: `koud`)
- Dedupe-check op email + telefoon → toont conflicten vóór import
- Per-rij validatie, importrapport na afloop (X aangemaakt, Y geskipped, Z fouten)

### 6. Analytics
- Aantal leads per fase
- Conversie koud → gewonnen per maand
- Doorzet-funnel: doorgezet → geclaimd → gewonnen (per affiliate)
- Top affiliates op gewonnen waarde
- Bron-performance

## Hoe affiliates het zien (bestaande flows, geen wijziging in hun UX)

- *Direct toegewezen*: lead verschijnt in hun **Mijn klanten / Pipeline** met `eigenaar_id = <affiliate>`.
- *Pool*: lead verschijnt in **AffiliatePool** met `eigenaar_id = NULL`. Bestaande `claim_affiliate_lead` RPC werkt.

## Technische details

### Database (1 migratie)
- Uitbreiding `affiliate_leads`:
  - `sales_fase` enum: `koud, benaderd, warm, gekwalificeerd, doorgezet, gewonnen, verloren` (nullable; null = niet in sales-pipeline, behandeld als reguliere affiliate-lead)
  - `toegewezen_door_admin_id uuid` (welke superadmin heeft doorgezet)
  - `doorgezet_op timestamptz`
  - `import_batch_id uuid` (link naar `affiliate_lead_imports` — die tabel bestaat al)
  - `tags text[]`
- Nieuwe enum-waarde voor `bron` indien nodig: `sales_admin`.
- RLS: nieuwe policy "superadmin volledige toegang tot affiliate_leads" (bestaat mogelijk al via `is_superadmin`); bestaande affiliate-policies ongemoeid.
- RPC `admin_doorzetten_naar_affiliate(_lead_id, _affiliate_id_or_null, _notitie)` — SECURITY DEFINER, check `is_superadmin(auth.uid())`. Zet `eigenaar_id`, `sales_fase='doorgezet'`, logt in `entiteit_historie`.
- RPC `admin_bulk_import_leads(_rows jsonb, _bestemming, _affiliate_id, _fase)` — SECURITY DEFINER, superadmin-only, dedupe op email/telefoon binnen batch, retourneert importrapport.

### Frontend
Onder strikte 800-regel en 50-regel-per-functie limieten, opgesplitst in modules:

```text
src/pages/sales/
  index.tsx                    # tabs-shell
  SalesPipeline/
    index.tsx
    KanbanKolom.tsx
    LeadKaart.tsx
    useSalesPipeline.ts
  SalesLeads/
    index.tsx
    LeadsTabel.tsx
    Filters.tsx
    BulkActieBar.tsx
  SalesImport/
    index.tsx
    CsvUploader.tsx
    KolomMapper.tsx           # auto-mapping logica
    PreviewTabel.tsx
    BestemmingKiezer.tsx
    useCsvImport.ts
  SalesAnalytics/
    index.tsx
    ConversieKaart.tsx
    AffiliatePrestatieTabel.tsx
  DoorzetDialog.tsx           # gedeeld: direct/pool keuze
  LeadDetailDrawer.tsx
src/hooks/sales/
  useSalesLeads.ts
  useDoorzetten.ts
  useCsvAutoMapping.ts
src/lib/sales/
  kolomMapping.ts             # synoniem-lijsten
  faseLabels.ts
```

### Toegang
- `ProtectedRoute` met `allowedRoles={["superadmin"]}` op alle `/sales/*` routes.
- Menu-item alleen renderen als `profile.rol === "superadmin"`.
- Geen module-key in `MODULES`-registry (omdat niet-configurable + superadmin-only).

### Hergebruik
- `affiliate_lead_contactmomenten` voor notities/calls
- `affiliate_lead_imports` voor importgeschiedenis
- `claim_affiliate_lead` RPC blijft de affiliate-claim flow
- Bestaande `AffiliatePool` en `AffiliateMijnKlanten` pagina's: geen wijziging nodig

## Buiten scope
- Aanpassingen aan affiliate-dashboard UX
- E-mail-automation vanuit sales (later)
- AI lead-scoring uitbreiden (bestaande `ai_score` blijft werken)
