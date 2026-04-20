

# Helpdesk-module — Gap-analyse & verbeterplan

Op basis van het functioneel ontwerp v1.0 versus de huidige codebase. Wat al staat, wat ontbreekt, en welke fouten/inefficiënties direct opgelost worden.

---

## A. Wat al werkt (groen)

| Onderdeel | Status |
|---|---|
| Ticketobject met nummer (`TKT-YYYY-0001`), prioriteit, type, kanaal, bron, klant/lead/opdracht/installatie/factuur-FK | ✅ Compleet |
| Klantkoppeling + duplicaatcheck via edge function (e-mail / telefoon / postcode) | ✅ Werkt |
| Dynamische intake-velden (categorie/merk/type/jaar/foutcode) | ✅ Basis aanwezig |
| Foutcode-Analyzer + AI Troubleshooter (Q&A flow + sessie-historie) | ✅ Werkt sinds vorige iteratie |
| Bijlagen + AI-analyse van bijlagen (`helpdesk-ai-analyze-bijlage`) | ✅ Werkt |
| Oplossingsveld verplicht voor `opgelost` + automatische KB-conceptgeneratie (`helpdesk-ai-genereer-kbartikel`) | ✅ Werkt |
| Service-bezoek & storing planning + urenverantwoording + digitale handtekening | ✅ Werkt |
| Taken (subtaken met deadline/prioriteit/toewijzing) | ✅ Werkt |
| Communicatie-tijdlijn (intern / inkomend / uitgaand) | ✅ Basis aanwezig |
| SLA-deadline trigger + escalatie-detectie (`mark_helpdesk_escalations`) | ✅ Werkt |
| Auto-notificaties via `helpdesk-notify` bij INSERT/escalatie/oplossing | ✅ Werkt |
| Audit-historie via `log_helpdesk_ticket_changes` trigger | ✅ Volledig |
| Multi-tenant RLS op alle 11 helpdesk-tabellen | ✅ Strict per `partner_id` |
| Dashboard met KPI-tegels + escalatielijst + SLA-controle | ✅ Werkt |
| Tickets-overzicht met lijst-/kanban-view, snelfilters, statusfilter | ✅ Werkt |
| Kennisbank met zoek & artikel-detail | ✅ Basis aanwezig |
| Autosave-draft (`useDraftAutosave` + `helpdesk_drafts`) | ✅ Hook bestaat |

---

## B. Bestaande zwakke plekken & quick fixes

| # | Issue | Locatie | Fix |
|---|---|---|---|
| 1 | **Communicatie-tab toont `richting` puur als label "intern/uitgaand/inkomend"** — geen visueel onderscheid tussen klant-zichtbaar vs. interne notitie | `CommunicatieTab.tsx` r.34-43 | Kleur-coding: gele rand + "🔒 Intern" badge voor interne notities, primair voor klantcommunicatie |
| 2 | **Geen e-mail-integratie naar tickets** — inkomende e-mails landen niet in ticket | — | Hergebruik bestaande `email_berichten` + nieuwe trigger: detecteer `[TKT-...]` in subject → koppel aan ticket |
| 3 | **Geen sjablonen voor uitgaande klantmail** ("monteur onderweg", "afspraak bevestigd") | `CommunicatieTab.tsx` | `helpdesk_email_sjablonen`-tabel + dropdown met variabele-substitutie (`{klant.voornaam}`, `{ticket.nummer}`) |
| 4 | **Communicatie-tab kan geen e-mail versturen** — alleen interne notitie | `CommunicatieTab.tsx` | Bij `richting=uitgaand` → invoke bestaande `email-api-send` met ticket-ref in subject |
| 5 | **Bron-locatie enum mist `portal` en `whatsapp`** | enum `helpdesk_bron_locatie` | Migratie: `ALTER TYPE` toevoegen |
| 6 | **Status-enum bevat dubbel `nieuw`/`open` zonder gebruik van `open`** + mist `wacht_op_onderdeel`, `ingepland`, `onderweg` | enum `helpdesk_ticket_status` | Migratie: `wacht_op_onderdeel`, `ingepland`, `onderweg` toevoegen; `open` deprecaten |
| 7 | **Dashboard escalatie-trigger draait elke render** zonder debounce | `Dashboard.tsx` r.30-35 | Eenmalige check bij mount + handmatige knop (knop bestaat al) |
| 8 | **Troubleshooter bewaart altijd, ook bij AI-fout** waardoor lege sessies worden opgeslagen | `helpdesk-ai-troubleshooter/index.ts` r.131-135 | Alleen INSERT na succesvolle parse |
| 9 | **Ticket-detail kop toont enkel "wisselen monteur"-select voor toewijzing**, geen prioriteit/status-wissel | `TicketDetail/index.tsx` | Prioriteit + status dropdown in kop toevoegen |
| 10 | **`helpdesk_kennis_artikelen`.views wordt nooit verhoogd** | `KennisArtikel.tsx` | RPC `increment_kb_views(_artikel_id)` bij open |
| 11 | **Geen ticket-zoeker per klant op klantkaart** | `KlantDetail.tsx` | Sectie "Tickets" met laatste 5 + "Nieuw ticket"-knop |

---

## C. Ontbrekende functionaliteit per FO-sectie

### C1. Intake & context (FO §3.2-3.4)
- **Productkoppeling vanuit installatie**: bij selectie installatie nu géén automatische load van merk/type/serienummer. → Auto-fill uit `installaties` + `opdracht.regels`.
- **Garantie-status zichtbaar in ticketkop**: nieuw veld `garantie_einddatum` op installaties → kleurbadge "Onder garantie" / "Verlopen".
- **Servicecontract-veld op klant**: nieuw `servicecontract` enum (`geen`, `basis`, `plus`, `premium`) → bepaalt SLA-profiel.

### C2. Categoriespecifieke intake (FO §3.4)
- Nu één plat formulier voor alle categorieën. → Hergebruik `SchouwCategoryFields`-patroon: per categorie eigen velden (firmware, EMS, omvormertype voor batterij; COP, koudemiddel voor warmtepomp; etc.).
- Nieuwe tabel `helpdesk_intake_velden` (partner_id, categorie, velden_jsonb) zodat partners zelf velden kunnen toevoegen.

### C3. Skill-matrix monteurs (FO §3.14)
- **Nieuw**: tabel `monteur_skills` (user_id, skill, certificaat_einddatum). Skills: F-gassen, STEK, hoogwerker, valbeveiliging, merk-gecertificeringen.
- **Nieuw**: bij toewijzing in `ServiceBezoekDialog` → filter monteurs op vereiste skill voor categorie + waarschuw bij certificaat <30 dagen verloop.
- **Nieuw**: Instellingen-pagina `/instellingen/skills` voor partner_admin.

### C4. LMRA / veiligheidschecklist (FO §3.14, §3.22)
- **Nieuw**: tabel `helpdesk_lmra_checklists` per categorie (gas-lektest, spanningscontrole, valbeveiliging, F-gassen-registratie).
- **Nieuw**: in `UrenVerantwoording.tsx` blok "LMRA voor aanvang" — verplicht ingevuld vóór status `afgerond`.

### C5. Garantie & factuur-automatisering (FO §3.16)
- **Nieuw**: bij ticket-afsluiting genereer `financiele_documenten`-concept met urenregels uit `helpdesk_service_bezoeken` + correct btw (9% verduurzaming, 21% overig).
- **Nieuw**: claim-draft naar fabrikant — voorlopig PDF-export (volledige API later).

### C6. Klantportaal & omnichannel (FO §3.18)
- **Nieuw**: `/portal/tickets` — eindklant ziet eigen tickets via bestaande consumer-rol-pattern (zie `auth/consumer-matching` memory).
- **Nieuw**: webformulier-widget (extra type in bestaande `widget-submit` flow).
- **WhatsApp**: alleen voorbereiding (kanaal-veld bestaat) — full integratie = fase 3.
- **CSAT**: nieuwe tabel `helpdesk_csat` (ticket_id, score 1-5, opmerking) + 1-vraag-dialog na ticket-sluiting + KPI op dashboard.

### C7. SLA-engine verfijning (FO §3.17)
- **Pauze-mechanisme ontbreekt**: bij status `wacht_op_klant` / `wacht_op_onderdeel` moet SLA-klok pauzeren. → Nieuwe tabel `helpdesk_sla_pauzes` (ticket_id, start, eind, reden) + RPC `bereken_sla_resterend(ticket_id)`.
- **80% waarschuwing**: cron-edge-function `helpdesk-sla-checker` (elke 15 min) → notificatie bij 80% van deadline.
- **Per-contract SLA-profielen**: kolom `sla_profiel_id` op klant → bepaalt strakkere uren.

### C8. KPI-dashboard (FO §3.20)
- **Nieuw**: `/helpdesk/kpi`-pagina (alleen partner_admin):
  - First-Time-Fix rate per monteur/categorie
  - MTTR (Mean Time To Resolve) per prioriteit
  - Repeat-visit rate (zelfde klant+product binnen 30 dgn)
  - KB-coverage (% tickets met KB-hit in troubleshooter)
  - AI-suggestie-acceptatie (op basis van nieuw veld `accepted` op `helpdesk_ticket_ai_sessies`)
  - CSAT-trend
  - SLA-halingspercentage

### C9. IoT / remote diagnostiek (FO §3.15)
- **Fase 3**: API-koppelingen Enphase/SolarEdge/Growatt/Mitsubishi/etc. — buiten scope MVP-uitbreiding nu. Plan: nieuwe tabel `iot_telemetrie_cache` + edge functions per vendor.

### C10. AI-troubleshooter — kwaliteit (FO §3.6)
- **Confidence-score & bronvermelding ontbreekt** — nu geen score per suggestie. → Aanpassing JSON-schema: per suggestie `confidence: 0-1` + `bronnen: string[]`.
- **Feedback-loop ontbreekt**: monteur kan suggesties niet beoordelen. → Nieuwe tabel `helpdesk_ai_feedback` (sessie_id, suggestie_index, oordeel: werkt/werkt-niet/deels) + KB-ranking aanpassen.

### C11. KB human-in-the-loop review (FO §3.9)
- **Reviewqueue ontbreekt** — concepten worden direct opgeslagen als `concept`, maar er is geen "Te reviewen"-pagina.
- **Nieuw**: `/helpdesk/kennisbank/review` voor partner_admin/technisch coördinator → goedkeuren/aanpassen/afwijzen.
- **Nieuw**: KB-rankvariabele `succes_ratio` (uses_succes / uses_totaal) → boost in zoek/AI-context.

### C12. Compliance (FO §3.22)
- **F-gassen-logboek**: bij categorie warmtepomp/airco met koudemiddel-handeling → verplichte velden (koudemiddeltype, hoeveelheid, technicus-certnummer) in oplossingsveld.
- **AVG-retentie**: tabel `helpdesk_retentie_config` (ticket_type → bewaartermijn). Cron `helpdesk-retentie-cleanup` archiveert oudere tickets.
- **Isolatie-checklist beschermde diersoorten**: bij categorie isolatie verplichte checklist.

---

## D. Architectuur-/code-verbeteringen (transversaal)

1. **Shared types**: `HelpdeskTicket` is gedupliceerd in `useTickets.ts` en sluit niet aan op DB-enum. → Zod-schema in `src/types/helpdesk.ts` + `z.infer`.
2. **Edge function CORS**: alle 6 helpdesk-functies missen `x-supabase-client-platform`-headers (recente SDK). → Standaard headers-set in `_shared/cors.ts`.
3. **Edge function input-validatie**: geen Zod-validatie op body's. → Toevoegen Zod parsing met 400-respons.
4. **`useTickets` zoekt met SQL-injectie-gevoelige `ilike.%${zoekterm}%`** zonder escapen. → Escapen van `,`, `(`, `)`, `%`, `*`.
5. **Geen pagineren op tickets** (nu max 1000 rows default). → Pagination via `range()` + infinite query.

---

## E. Voorgestelde gefaseerde uitvoering

### Fase 1 — Quick fixes & MVP-aanvullingen (1-2 dagen)
B1, B5-B11 (UI fixes, enum-uitbreiding, history-knop, status-dropdown in kop) +
**E-mail twee-richtingen op tickets** (B2-B4) + **klantkaart toont tickets** (B11) + **AI-bronnen/confidence** (C10 deel 1) + **KB-views increment** (B10) + **CSAT-dialog na sluiting** (C6 deel 1) + **input-validatie/CORS-fix in edge functions** (D2-D3).

### Fase 2 — SLA, KB-review, KPI's (2-3 dagen)
C7 (SLA-pauzes + 80%-checker), C11 (KB review-queue + succes_ratio), C8 (KPI-dashboard), C10 deel 2 (feedback-loop), B3 (e-mail-sjablonen).

### Fase 3 — Skills, LMRA, garantie, factuur (3-4 dagen)
C3 (skill-matrix), C4 (LMRA-checklists), C5 (factuur-concept generator + garantie-badge), C12 (F-gassen-logboek + retentie + isolatie-checklist), C2 (categorie-specifieke intake-velden).

### Fase 4 — Klantportaal & omnichannel (3-4 dagen)
C6 (consumer-portal `/portal/tickets`, webformulier-widget, WhatsApp-voorbereiding).

### Fase 5 — IoT & remote (langer traject — apart plan)
C9 — vendor-API's per merk afzonderlijk.

---

## F. Bevestiging nodig — kies waar we nu starten

1. **Volledige Fase 1 in één klap** (alle quick fixes + e-mail-koppeling + AI-bronnen + CSAT + klantkaart-tickets) — geschat ~700 regels code, 1 migratie.
2. **Alleen de B-tabel (zwakke plekken)** als snelle opruim, en C-fasen apart inplannen.
3. **Eigen selectie**: jij geeft aan welke nummers (B/C) je nu wilt en welke later.

Welke ga ik uitwerken in implementatie-mode?

