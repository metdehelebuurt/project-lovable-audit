## Doel

De sales-module evolueert van een vaste lijst koude leads naar een volwaardig sales-systeem. Iedereen die met een pipeline werkt (platform-admin én affiliate) kan zijn eigen fases beheren, "temperatuur" wordt het centrale begrip om koud/lauw/warm/heet aan te geven, en de hele lead-flow wordt vanuit het perspectief van een sales manager doorgelicht.

---

## Sales-manager analyse: waar gaat het nu mis

Vanuit de rol "sales manager die dagelijks naar deze module kijkt":

**1. Lead-temperatuur en pipeline-fase lopen door elkaar.** "Koud" en "warm" staan nu in dezelfde rij als "Benaderd" en "Gekwalificeerd". Een lead kan tegelijk "warm" zijn én "in offerte" — dat past niet in één enum. Een sales manager wil filteren op "alle hete leads waar nog geen contact mee is geweest" — onmogelijk vandaag.

**2. Geen onderscheid bij doorzetten.** Affiliate ontvangt een lead zonder context: hoe goed is deze lead? Is er al gesproken? Hoe snel moet hij bellen? Resultaat: hete leads koelen af in de pool.

**3. "Koude leads" als naam is verwarrend.** De pool bevat in praktijk alles van koud tot bijna-deal. Affiliates negeren de pool omdat het label "koud" klinkt als slecht.

**4. Vaste pipeline-fases passen niet bij elke werkwijze.** Sommige affiliates werken met 4 fases, anderen met 8. Een vaste enum dwingt iedereen in hetzelfde proces — dat werkt niet voor B2B (langere cyclus) vs B2C (korte cyclus).

**5. Geen SLA / aging zichtbaar.** Een lead die 14 dagen in "Benaderd" staat hoort een rood signaal te krijgen. Nu zie je dat niet.

**6. Bulk doorzetten kent geen prioriteit.** Bij 50 leads in één klik doorzetten heeft geen affiliate zicht op welke 5 echt hot zijn.

**7. Conversie per temperatuur is onmeetbaar.** Hoeveel % van de warme leads wordt gewonnen? Geen rapport.

**8. Lead-bron en kwaliteits-score ontbreken.** Een lead uit "AI-scrape" is een andere klasse dan een lead uit "Inbound formulier" — wordt nu identiek behandeld.

**9. Geen volgende-stap-discipline.** Geen verplichte "volgende actie + datum" op een lead. Leads vallen stil zonder dat iemand het ziet.

**10. Activity-log is read-only.** Geen mogelijkheid om snel een belnotitie of WhatsApp-uitkomst te loggen vanuit de pipeline-kaart zelf.

---

## Scope van dit plan

Vier verbeteringen die de basis leggen voor de rest. De overige punten uit de analyse staan onderaan als roadmap.

### 1. Temperatuur vervangt koud/warm-fases

Nieuw veld `temperatuur` op `affiliate_leads`: `koud | lauw | warm | heet`. De pipeline-fases worden puur procesgericht: `nieuw`, `benaderd`, `gekwalificeerd`, `voorstel`, `onderhandeling`, `gewonnen`, `verloren` (defaults, verder configureerbaar). De huidige `sales_fase` waarden `koud` en `warm` worden via een migratie omgezet naar `temperatuur` + nieuwe fase (`koud` → fase `nieuw` + temperatuur `koud`; `warm` → fase `benaderd` + temperatuur `warm`).

Visueel onderscheid via een gekleurd vlammetje/thermometer-icoon op elke leadkaart en een filter-chip-rij ("Alle · Heet · Warm · Lauw · Koud") boven pipeline én lijstweergave.

### 2. Doorzetten met temperatuur

In `DoorzetDialog`:

- Verplichte keuze "Hoe heet is deze lead?" met 4 visuele knoppen (icoon + kleur).
- Optioneel veld "Volgende actie binnen" (vandaag / 24u / 3 dagen / week) → wordt opgeslagen als `volgende_actie_op`.
- De toewijzingnotitie krijgt een placeholder met suggesties per temperatuur.

Bij bulk-doorzetten dezelfde temperatuur-keuze één keer voor de hele batch, plus optie "Behoud per-lead temperatuur als die al is gezet".

### 3. Configureerbare pipeline per gebruiker

Elke gebruiker die met een pipeline werkt (superadmin én elke affiliate) krijgt zijn eigen set fases. Nieuwe tabel `pipeline_configuraties` per `user_id`:

- `fase_key` (slug), `label`, `kleur_token`, `volgorde`, `is_eindfase` (won/lost), `default_temperatuur` (optioneel).
- Een platform-default set wordt automatisch geseed bij eerste gebruik.
- Gebruiker beheert in nieuw scherm "Pipeline-instellingen": drag-to-reorder, hernoemen, kleur kiezen, fases toevoegen/verbergen, eindfases markeren.

Leads slaan hun fase op als slug-string (niet meer als enum) zodat configuraties vrij kunnen zijn. Validatie: een lead-update mag alleen een fase-slug zetten die in de configuratie van de eigenaar bestaat.

### 4. Hernoeming + duidelijk onderscheid

- Sidebar-item "Koude leads" (affiliate) → **"Leads"** met ondertitel "pool & toegewezen".
- AffiliatePool-titel "Koude leads pool" → **"Leadpool"**.
- Sales-tab in admin-CRM heet straks **"Sales"** met sub-tabs: Pipeline · Alle leads · Importeren · Analytics · Pipeline-instellingen.
- Leadlijst krijgt vaste temperatuur-kolom (gekleurde badge) + fase-kolom (los).
- Pipeline-kanban krijgt per kolom een kleine temperatuur-verdeling (4 mini-bars boven het aantal).

---

## Technische details

**Database-migratie (één migratie, append-only):**

1. `CREATE TYPE public.lead_temperatuur AS ENUM ('koud','lauw','warm','heet');`
2. `ALTER TABLE affiliate_leads ADD COLUMN temperatuur lead_temperatuur DEFAULT 'koud' NOT NULL;`
3. `ALTER TABLE affiliate_leads ADD COLUMN volgende_actie_op timestamptz;`
4. `ALTER TABLE affiliate_leads ADD COLUMN fase_slug text;` (nieuwe kolom; oude `sales_fase` blijft tijdelijk voor backward compat).
5. Backfill: `koud` → `temperatuur='koud', fase_slug='nieuw'`; `warm` → `temperatuur='warm', fase_slug='benaderd'`; `benaderd/gekwalificeerd/doorgezet/gewonnen/verloren` → identieke slug + temperatuur op `lauw` als default.
6. `CREATE TABLE public.pipeline_configuraties (id uuid pk, user_id uuid, fase_key text, label text, kleur text, volgorde int, is_eindfase boolean, default_temperatuur lead_temperatuur, ...)` met indexes op `(user_id, volgorde)` en unique `(user_id, fase_key)`.
7. GRANTs (`SELECT/INSERT/UPDATE/DELETE` op `authenticated`, `ALL` op `service_role`) → daarna RLS aan → policies: gebruiker beheert eigen rijen, superadmin alles.
8. `INSERT`-functie `seed_default_pipeline(_user_id)` die de 7 default-fases neerzet bij eerste lookup.
9. RPC `update_lead_fase(_lead_id, _fase_slug)` die valideert tegen pipeline van eigenaar.
10. Bestaande `admin_doorzetten_naar_affiliate` uitbreiden met `_temperatuur` en `_volgende_actie_op` parameters (oude signature blijft via overload).

**Frontend-bestanden (alle <800 regels, gesplitst waar nodig):**

- `src/lib/sales/temperatuur.ts` — enum, labels, kleuren, iconen.
- `src/lib/sales/pipeline.ts` — types `PipelineFase`, helpers voor sortering/lookup.
- `src/hooks/sales/usePipelineConfig.ts` — fetch + mutate fases voor huidige user.
- `src/pages/sales/PipelineInstellingen/` — folder met `index.tsx`, `FaseRij.tsx`, `KleurKiezer.tsx`, `NieuweFaseDialog.tsx`.
- `src/components/sales/TemperatuurBadge.tsx` + `TemperatuurFilter.tsx`.
- Update `SalesPipeline/index.tsx` — kolommen dynamisch uit `usePipelineConfig`, mini temperatuur-bars.
- Update `LeadKaart.tsx` — temperatuur-icoon links, aging-indicator als `volgende_actie_op` is overschreden.
- Update `DoorzetDialog.tsx` — temperatuur-knoppen + volgende-actie-keuze.
- Update `BulkActieBalk.tsx` — temperatuur in bulk-doorzet.
- Update `LeadDetailDrawer.tsx` — temperatuur-veld los van fase, volgende-actie datepicker.
- Update navigation: `affiliatePool` label "Koude leads" → "Leads".
- Update `AffiliatePool.tsx` titel + microcopy.
- `src/pages/affiliate/AffiliatePipeline.tsx` werkt nu ook met `usePipelineConfig` voor de affiliate.

**Compat:** `sales_fase` enum-kolom blijft 1 release behouden zodat de oude analytics-views niet breken. Nieuwe code leest uitsluitend `fase_slug`.

---

## Roadmap (niet in dit plan, wel logisch vervolg)

Op volgorde van impact:

1. **Aging & SLA-signalen** — kleur-escalatie op kaarten als lead te lang stilstaat.
2. **Verplichte volgende-actie** — pipeline blokkeert opslag zonder next-step in actieve fases.
3. **Conversie per temperatuur & per fase** — analytics-tab.
4. **Lead-score** — automatische score op basis van bron, branche, gedrag.
5. **Inline activity-log** — belnotitie/uitkomst loggen direct vanaf kaart.
6. **Lead-bron management** — herkomst als first-class veld met rapportage.
7. **Templates per temperatuur** — e-mail/WhatsApp snippets per "heet"-niveau.

---

## Acceptatie

- Doorzetten zonder temperatuur kiezen is niet mogelijk.
- Pipeline-instellingen-scherm: fase toevoegen, hernoemen, herordenen werkt en is direct zichtbaar in pipeline.
- Lijst- én kanban-view tonen temperatuur duidelijk gescheiden van fase.
- Sidebar zegt nergens nog "Koude leads".
- Bestaande leads zijn correct gemigreerd; geen "koud" of "warm" meer in `fase_slug`.