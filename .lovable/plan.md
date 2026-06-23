
## Status-audit van de 7 roadmap-items

Op basis van een rondgang door `src/pages/sales`, `src/pages/affiliate`, `src/components/sales`, `src/hooks/sales`, de edge-functions en de huidige `affiliate_leads`-kolommen:

| # | Item | Status | Opmerking |
|---|---|---|---|
| 1 | Aging & SLA-signalen | **Gedeeltelijk** | Werkt op `LeadKaart` (10d amber / 21d rose / overdue rose). Ontbreekt op `SalesLeads`-lijst, `AffiliatePipeline`, `AffiliatePool`. Geen aparte SLA per fase. |
| 2 | Verplichte volgende-actie | **Niet gebouwd** | Pipeline accepteert opslag zonder `volgende_actie_op` in actieve fases. |
| 3 | Conversie per temperatuur & fase | **Gebouwd** | `SalesAnalytics` toont temperatuur-breakdown en dynamische funnel. Mist tijdsfilter en throughput/cycle-time per fase. |
| 4 | Lead-score | **Backend wel, UI niet** | Edge function `ai-affiliate-lead-score` + kolommen `ai_score*` bestaan en worden in affiliate-belwerkbank gebruikt. **Niet zichtbaar of triggerbaar in sales-module** (LeadKaart, LeadDetailDrawer, SalesLeads, Pipeline). Geen deterministische score (bron/branche/gedrag) — alleen AI. |
| 5 | Inline activity-log | **Gebouwd** | `ContactmomentDialog` op LeadKaart + drawer. Affiliate-kant heeft eigen flow (`affiliate_lead_contactmomenten`). Niet gekoppeld aan SLA-reset of aging-teller. |
| 6 | Lead-bron management | **Niet gebouwd** | `bron` is harde enum, geen beheerscherm, geen rapport, geen koppeling aan score. |
| 7 | Templates per temperatuur | **Niet gebouwd** | `email_templates` bestaat maar geen koppeling aan `temperatuur`. Geen WhatsApp-snippets. |

## Extra hiaten / loose ends gevonden

- **Dubbele waarheid voor "volgende actie"**: `volgende_actie_datum` (date, oud), `volgende_actie_op` (timestamptz, nieuw) en `ai_volgende_actie_op` leven naast elkaar. Sales-code leest `volgende_actie_op`, affiliate-code leest `volgende_actie_datum`. Risico op desync.
- **`sales_fase` enum + nieuwe `fase_slug`** lopen door elkaar. `useCreateSalesLead` zet nog `sales_fase: "koud"`. Pipeline-DnD: nog niet duidelijk of die `fase_slug` schrijft via `update_lead_fase` RPC met validatie.
- **Temperatuur ontbreekt op AffiliatePipeline en AffiliatePool-kaarten** (alleen sales-kant heeft `TemperatuurBadge`).
- **AI bedrijf-samenvatting** zit nu alleen in `AffiliateBellen` — dezelfde context zou nuttig zijn in sales-LeadDetailDrawer.
- **Activity-log inconsistent**: sales gebruikt `lead_contactmomenten`, affiliate gebruikt `affiliate_lead_contactmomenten`. Bij doorzetten gaat historie verloren voor de affiliate.
- **`SalesAnalytics`** heeft geen periode-filter en geen "no-touch leads" KPI (leads zonder contact > X dagen).
- **Dedupe** draait alleen bij CSV-import, niet bij handmatig aanmaken via `useCreateSalesLead`.
- **Bulk-temperatuur in `BulkActieBalk`** schrijft direct naar DB zonder activity-log entry → audit-gat.
- **`PipelineInstellingen`** validatie: `is_eindfase` mag meervoudig per `default_temperatuur='heet'` zijn — geen guard tegen ontbrekende won/lost fase.

## Scope van dit plan

In één samenhangende slag de 4 ontbrekende items bouwen + de loose ends die met deze flow raken. AI-bedrijfssamenvatting in sales-drawer en periode-filter analytics meegenomen omdat ze één edit raken.

### 1. Verplichte volgende-actie (roadmap #2)

- Nieuw veld op `pipeline_configuraties`: `vereist_volgende_actie boolean default true` voor niet-eindfases.
- `update_lead_fase` RPC uitbreiden: als doelfase `vereist_volgende_actie=true` én lead heeft geen `volgende_actie_op` in de toekomst → `RAISE EXCEPTION 'volgende_actie_verplicht'`.
- `useUpdateSalesLead` en pipeline-DnD vangen die error en openen automatisch `ContactmomentDialog` met focus op datum.
- `DoorzetDialog`: "Volgende actie binnen" wordt verplicht voor doelfases met die vlag.
- `PipelineInstellingen`-rij krijgt toggle "Verplicht volgende-actie".

### 2. Lead-score in sales-UI + deterministische component (roadmap #4)

- Nieuwe kolom `lead_score_basis int` (0-100) en `lead_score_basis_details jsonb` op `affiliate_leads`. Berekend client-side + bij insert/update via trigger of edge-helper op basis van: bron-gewicht, branche-match, aanwezigheid email+telefoon+website, dagen sinds laatste activiteit, aantal contactmomenten, temperatuur.
- Combined score = `0.6 * ai_score + 0.4 * lead_score_basis` (fallback naar één als ander mist).
- `LeadKaart` toont compacte score-pill links onderaan; `LeadDetailDrawer` toont breakdown + knop "AI hercalculeren" (roept bestaande `ai-affiliate-lead-score` aan).
- `SalesLeads`-tabel krijgt sorteerbare score-kolom.
- Edge-function uitbreiden: combineren met deterministische component, score als één getal terugschrijven.

### 3. Lead-bron als first-class veld (roadmap #6)

- Nieuwe tabel `lead_bronnen`:
  - `id`, `slug`, `label`, `categorie` (inbound/outbound/import/referral/ai), `kleur`, `actief`, `default_temperatuur`, `score_gewicht int default 0`, `eigenaar_id` (null = platform).
- Migratie seedt huidige enum-waarden als rijen; voegt `bron_id uuid references lead_bronnen` toe op `affiliate_leads`. Oude `bron`-enum-kolom blijft één release (compat), nieuwe code schrijft alleen `bron_id`.
- Beheer-scherm `src/pages/sales/BronnenBeheer/` (CRUD + sortering, kleur, score-gewicht).
- `DoorzetDialog`, `LeadDetailDrawer`, import-flow tonen bron-dropdown met kleurchip.
- `SalesAnalytics` krijgt "Bron-rapport"-kaart: aantal, conversie %, gemiddelde waarde, gem. cycle-time per bron.
- Score-engine (zie #2) gebruikt `lead_bronnen.score_gewicht`.

### 4. Templates per temperatuur (roadmap #7)

- Nieuwe tabel `sales_snippets`:
  - `id`, `eigenaar_id`, `kanaal` (`email` | `whatsapp` | `sms`), `temperatuur` (`koud`/`lauw`/`warm`/`heet` of `null`=algemeen), `titel`, `onderwerp` (email), `body_html`/`body_text`, `volgorde`, `actief`.
- Beheer in `src/pages/sales/SnippetsBeheer/` met live-preview en variabele-tags (`{{bedrijfsnaam}}`, `{{contactpersoon}}`, `{{eigen_naam}}`).
- `ContactmomentDialog` + `LeadDetailDrawer` krijgen "Snippet kiezen"-knop die op basis van huidige lead-temperatuur passende snippets toont.
- WhatsApp = mailto-vervanger: opent `https://wa.me/<telefoon>?text=...` met ingevulde body.
- Email: opent draft via bestaande email-flow (placeholder hook `useOpenEmailDraft`); voor nu prefill subject+body in `<a href="mailto:">`.

### 5. Aging & SLA per fase + uitbreiding zichtbaarheid (roadmap #1 vervolmaken)

- `pipeline_configuraties` krijgt `sla_dagen int default null`.
- Aging-niveau wordt: `dagenStil >= sla_dagen` (uit fase-config) → rose; `>= sla_dagen * 0.5` → amber. Fallback: huidige 10/21d.
- `TemperatuurBadge` + aging-strip toevoegen aan `AffiliatePipeline` en `AffiliatePool`-kaarten.
- `SalesLeads`-tabel: nieuwe kolom "Stil" met dezelfde kleuren.

### 6. Loose ends opruimen

- `useCreateSalesLead` schrijft `fase_slug='nieuw'` i.p.v. `sales_fase`; default `temperatuur='koud'`.
- Activity-log unificeren: één hook `useLeadContactmomenten(leadId, scope)` die afhankelijk van eigenaar (`affiliate` vs `sales`) de juiste tabel raakt en intern de andere tabel niet meer aanmaakt. Bij doorzetten worden bestaande sales-contactmomenten gemirrord als read-only entries in affiliate-tijdlijn.
- `volgende_actie_datum` (date) wordt deprecated kolom: trigger spiegelt automatisch met `volgende_actie_op` totdat affiliate-UI is omgezet (separate ticket).
- `BulkActieBalk` schrijft per geraakte lead een `lead_contactmomenten`-entry `type='systeem'` met de bulk-actie.
- `SalesAnalytics` krijgt periode-selector (7/30/90d/YTD) en KPI "Leads zonder contact > 14d".
- Bedrijf-samenvatting (`BedrijfSamenvattingKaart`) ook tonen in `LeadDetailDrawer`.
- `PipelineInstellingen`: validatie minstens 1 fase met `is_eindfase=true` en kleuren-token-check.

## Technische details

**Database (één migratie):**

```text
ALTER TABLE pipeline_configuraties
  ADD COLUMN vereist_volgende_actie boolean NOT NULL DEFAULT true,
  ADD COLUMN sla_dagen int;

ALTER TABLE affiliate_leads
  ADD COLUMN lead_score_basis int,
  ADD COLUMN lead_score_basis_details jsonb,
  ADD COLUMN bron_id uuid; -- FK na seed

CREATE TABLE lead_bronnen (...);    -- + GRANT + RLS (auth: select all, insert/update/delete: own of superadmin)
CREATE TABLE sales_snippets (...);  -- + GRANT + RLS (own rows of superadmin)

-- Seed lead_bronnen vanuit bestaande enum + backfill affiliate_leads.bron_id

-- RPC update: update_lead_fase met validatie vereist_volgende_actie
-- Trigger op affiliate_leads BEFORE INSERT/UPDATE → bereken lead_score_basis
-- Trigger spiegelt volgende_actie_datum <-> volgende_actie_op
```

**Frontend-bestanden (alles <800 regels, helpers <50 regels):**

- `src/lib/sales/leadScore.ts` — deterministische scoreberekening + combined formule.
- `src/lib/sales/snippetVars.ts` — variabele-resolver `{{bedrijfsnaam}}` etc.
- `src/hooks/sales/useLeadBronnen.ts`, `useSnippets.ts`, `useLeadScore.ts`.
- `src/components/sales/LeadScorePill.tsx`, `BronBadge.tsx`, `SnippetMenu.tsx`, `AgingIndicator.tsx` (extract uit LeadKaart).
- `src/pages/sales/BronnenBeheer/` (`index.tsx`, `BronRij.tsx`).
- `src/pages/sales/SnippetsBeheer/` (`index.tsx`, `SnippetEditor.tsx`, `Voorbeeld.tsx`).
- Updates: `LeadKaart`, `LeadDetailDrawer`, `DoorzetDialog`, `BulkActieBalk`, `SalesLeads/index.tsx`, `SalesAnalytics/index.tsx`, `PipelineInstellingen/FaseRij.tsx`, `AffiliatePipeline.tsx`, `AffiliatePool.tsx`, `ContactmomentDialog`, `useDoorzetten`, `useSalesLeads.useCreateSalesLead`, sub-nav (`Sales > Bronnen`, `Sales > Snippets`).
- Edge-function `ai-affiliate-lead-score`: combineert met `lead_score_basis` voordat de combined score wordt opgeslagen.

**Compat:** `bron`-enum-kolom en `volgende_actie_datum`-date-kolom blijven 1 release, gespiegeld via trigger. `sales_fase`-enum blijft eveneens; nieuwe writes gaan via `fase_slug`.

## Acceptatie

- Een lead in actieve fase kan niet worden opgeslagen zonder `volgende_actie_op` als de fase dat vereist (zowel pipeline-DnD als drawer).
- Score-pill zichtbaar op elke kaart en sorteerbaar in lijst; AI-knop hercalculeert en update zichtbaar.
- Bronnen-beheer werkt; bron is selecteerbaar bij doorzetten/aanmaken; analytics-tab toont bron-rapport.
- Snippets-beheer werkt; `ContactmomentDialog` toont snippets passend bij temperatuur, opent mailto/WhatsApp met variabelen ingevuld.
- Aging gebruikt SLA-dagen uit fase-config wanneer gezet; affiliate-pipeline/pool tonen temperatuur en aging-strip.
- Sales-analytics heeft periode-filter en "leads zonder contact"-KPI; bedrijf-samenvatting zichtbaar in sales-drawer.
- Geen schrijfacties meer op `sales_fase` of `volgende_actie_datum` vanuit nieuwe code; oude waardes blijven leesbaar.

## Niet in dit plan

- Echte WhatsApp Business API-integratie (alleen `wa.me`-deeplink).
- Hervorming affiliate-contactmomenten naar één gedeelde tabel (alleen mirror-mechanisme).
- Workflow-automation rond snippets (bv. auto-sturen na X dagen stil).
