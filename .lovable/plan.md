# Kritische analyse Sales Manager rol + verbeterplan

Na review van het huidige Sales CRM (pipeline, trials, leads, analytics, snippets) mist een sales manager vooral **overzicht op teamniveau, sturingsinformatie en AI-hulp bij dagelijkse beslissingen**. Alles wat we bouwen krijgt Playwright e2e-tests.

## Wat er nu goed staat
Pipeline, trials-overzicht, warmte, filters, upsell-badge, gedeelde notities, snippets, analytics-tab, bronnenbeheer.

## Wat een sales manager mist (kritisch)

### 1. Team-cockpit (nieuwe tab "Team")
- Per sales-rep: aantal actieve leads, waarde in pipeline, activiteit deze week (calls, mails, demo's), conversie, gemiddelde doorlooptijd per fase, no-touch dagen.
- Stoplicht-signalen: reps met achterstallige opvolging, leads zonder activiteit >7d, trials die verlopen zonder contact.
- Werkdruk-verdeling (leads per rep vs capaciteit) + één-klik herverdeling.

### 2. AI Sales Coach (Gemini)
- **Dagelijkse briefing** per manager: "3 deals wankelen, 2 trials verlopen deze week, rep X heeft 5 no-touch leads". Edge function `sales-manager-briefing` genereert 's ochtends een samenvatting.
- **Deal-risico score** per lead: AI leest historie/notities/mails en scoort risico (groen/oranje/rood) + reden + aanbevolen next step.
- **Coaching-tips per rep**: AI analyseert opvolg-log en snippets-gebruik, geeft concrete tip ("rep gebruikt geen bezwaar-snippet bij prijsvragen").

### 3. Forecast & pipeline-gezondheid
- Weighted forecast (waarde × fase-kans) per week/maand/kwartaal, per rep en totaal.
- Pipeline-gezondheid: dekking t.o.v. target, gap-analyse, aging per fase (hoe lang staat een lead vast).
- Win/Loss-analyse met AI-clusters van redenen (bestaat deels, uitbreiden naar dashboard).

### 4. Next-Best-Action lijst
- Één "wat-nu" lijst voor de manager en per rep: 10 acties gesorteerd op impact (trial verloopt + hoge waarde bovenaan). Direct doorklikken.

### 5. Activiteit- & communicatie-inzicht
- Team-agenda-view (alle demo's/belafspraken op één kalender, filter per rep).
- Response-tijd metrics op inbox (eerste reactietijd, SLA-breaches).
- "Silent leads" alert: leads waar 0 activiteit is geweest in X dagen.

### 6. Trial-conversie-motor
- Trial-lifecycle board (Dag 1 / Dag 7 / Dag 21 / Dag 28) met per fase suggested action.
- Auto-trigger AI-mailconcept bij Dag 21-30 met upsell-argumenten uit gebruiksdata.
- Health-score per trial (login-freq, features gebruikt, upsell-signalen) — pull uit bestaande activity/subscription tabellen.

### 7. Doelen & targets
- Uitbreiden `affiliate_targets` → team-target per maand + per rep. Progressbar in Team-cockpit.
- Manager kan targets zetten en zien wie voor/achterloopt.

### 8. Kennisdeling
- "Winning plays" library: gewonnen deals gemarkeerd → snippet-suggestie voor de rest, met AI-samenvatting waarom die deal gewonnen werd.
- Objection-library gevoed door Lost-reviews.

## Aanpak & bouwvolgorde

**Fase A (deze ronde):** Team-cockpit, AI dagelijkse briefing, Deal-risico score, Next-Best-Action lijst.
**Fase B (volgende ronde):** Forecast/pipeline-gezondheid, Trial-lifecycle board, Team-agenda.
**Fase C:** Team-targets, Coaching-tips, Winning-plays library.

Ik stel voor **Fase A nu te bouwen** — dat geeft direct de meeste waarde. Fase B en C leg ik vast als vervolgvoorstel.

## Technische opzet Fase A

**Nieuwe files:**
- `src/pages/sales/TeamCockpit/index.tsx` — dashboard-layout met KPI's per rep, stoplichten, herverdeel-actie.
- `src/pages/sales/TeamCockpit/RepKaart.tsx` — kaart per sales-rep.
- `src/pages/sales/TeamCockpit/NextBestActionLijst.tsx` — top-10 acties.
- `src/pages/sales/TeamCockpit/DagelijkseBriefing.tsx` — AI-samenvatting boven in.
- `src/hooks/sales/useTeamStats.ts` — aggregatie per eigenaar (uit `affiliate_leads`, `affiliate_opvolg_log`, `affiliate_terugbel_afspraken`).
- `src/hooks/sales/useNextBestActions.ts` — geordende actielijst.
- `src/hooks/sales/useDealRisico.ts` — leest cached AI-scores.
- `src/hooks/sales/useDagelijkseBriefing.ts` — call naar edge function, dagelijks gecached.
- `src/components/sales/RisicoBadge.tsx` — groen/oranje/rood.

**Edge functions (Lovable AI Gateway, `google/gemini-3-flash-preview`):**
- `sales-manager-briefing` — genereert dagelijkse briefing op basis van team-data, rolcheck (superadmin/sales_manager/sales_admin).
- `sales-deal-risico` — batch of on-demand risicoscore per lead; slaat op in nieuwe kolommen op `affiliate_leads` (`risico_score`, `risico_reden`, `risico_next_step`, `risico_bijgewerkt_op`).

**DB migratie:**
- Kolommen toevoegen aan `affiliate_leads`: `risico_score text`, `risico_reden text`, `risico_next_step text`, `risico_bijgewerkt_op timestamptz`.
- Tabel `sales_briefings` (id, gebruiker_id, datum, inhoud jsonb, created_at) + RLS + GRANTs.

**Integratie:**
- Nieuwe tab "Team" in `src/pages/sales/index.tsx` (alleen zichtbaar voor superadmin/sales_manager/sales_admin).
- `RisicoBadge` op `SalesPipeline/LeadKaart` en `SalesLeads` tabel.

**E2E tests (Playwright, `tests/sales-*.spec.ts`):**
- `tests/sales-team-cockpit.spec.ts` — login als sales_manager, zie team-cockpit-tab, KPI's per rep, stoplichten renderen.
- `tests/sales-briefing.spec.ts` — briefing-kaart laadt, refresh-knop werkt.
- `tests/sales-risico.spec.ts` — risico-badge zichtbaar op leadkaart en leadlijst.
- `tests/sales-next-best-action.spec.ts` — top-10 actielijst rendert, klik navigeert naar lead.
- Rol-check test: gewone affiliate ziet Team-tab NIET.

## Buiten scope (voor nu)
Fase B en C (forecast, trial-lifecycle board, targets, winning-plays), URL-sync van filters, exports, real-time notificaties, mobile-native app.
