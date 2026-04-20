

# Audit Helpdesk Module — Bevindingen & Fix Plan

## ✅ Wat goed werkt

**Database (compleet en correct):**
- 11 tabellen aanwezig met partner-strikte RLS-policies (35 policies actief)
- Multi-tenant isolatie correct: partner A ziet nooit data van partner B
- Installateurs hebben aparte SELECT-policy ("ziet eigen tickets")
- SLA-trigger `set_helpdesk_sla_deadline` actief, escalatie-RPC `mark_helpdesk_escalations` werkt
- Ticketnummering `TKT-YYYY-0001` per partner via RPC
- Storage bucket `helpdesk-media` private aangemaakt

**Edge Functions (deployed en bereikbaar):**
- `helpdesk-notify` antwoordt 200 (getest, geeft "geen config" terug — verwacht voor lege test)
- `helpdesk-ai-foutcode`, `-troubleshooter`, `-genereer-kbartikel`, `-analyze-bijlage` zijn deployed met `verify_jwt = true` — auth-flow correct ingesteld

**UI (alle 8 tabs aanwezig):**
- Dashboard met 5 KPI's + escalatie-lijst + auto-escalatie effect
- Tickets-overzicht met zoek + status/prioriteit/type-badges
- TicketDetail tabs: Overzicht / Analyzer / Communicatie / Bijlagen / Planning / Taken / Oplossing / Historie
- Sidebar groep "Helpdesk & Service" voor 5 rollen
- AI-functies UI: Foutcode-Analyzer, Troubleshooter, Bijlage-analyse, KB-generator
- Service-bezoek dialog + monteur-keuze + UrenVerantwoording met handtekening (verplicht oplossing-veld)
- Auto-save drafts hook + KPI-cards

## ⚠️ Bevindingen & gaps t.o.v. eisen

### 1. KRITIEK — Ontbrekende "Ticket aanmaken" knoppen (eis expliciet)
De briefing eist: "Tickets moeten kunnen worden aangemaakt in **orders, installaties en in een factuur**". Een grep-scan van `OpdrachtDetail.tsx`, `Installaties.tsx`, `FactuurDetail.tsx`, `KlantDetail.tsx` vindt **geen enkele referentie** naar `/helpdesk/tickets/nieuw`. De `bron_locatie` query-param wordt wel gelezen door `TicketNieuw`, maar niemand stuurt erheen.

### 2. KRITIEK — Geen klant-zoek + duplicaatcheck in nieuw ticket
TicketNieuw heeft alleen losse tekstvelden voor merk/categorie/foutcode. Er is **geen klant-zoek**, geen "nieuwe klant aanmaken vanuit ticket", geen duplicaatcheck op email/telefoon/adres (eis expliciet genoemd in usercase 1). De `helpdesk-klant-duplicaat-check` edge function uit het oorspronkelijke plan is nooit gebouwd.

### 3. KRITIEK — Productcontext laadt niet automatisch vanuit order
Eis: "als er een order aan gekoppeld kan worden laden gelijk de productgegevens met type, merk, installatiejaar". Nu moet de gebruiker dit handmatig invullen. `OverzichtTab` toont alleen UUIDs (rauwe `klant_id`, `opdracht_id`) i.p.v. bruikbare namen/links.

### 4. BELANGRIJK — Tickets-overzicht mist filters & Kanban
Eis: "in het ticketoverzicht moeten handige functies zitten die hoge prio tickets laten zien, ticket escalatie, planning, opvolging". Nu is er alleen een tekst-zoekveld. Geen filters op status/prio/type/toegewezene, geen Kanban-view, geen "alleen escalaties / open / mijn tickets" tabs.

### 5. BELANGRIJK — Notificatie-config UI bestaat niet
Eis: "meldingen per mail moeten in de backend geconfigureerd kunnen worden". Tabel `helpdesk_notificatie_config` bestaat, maar er is **geen UI** in `/instellingen` om het te beheren. Daarom geeft `helpdesk-notify` nu altijd "skipped: geen config".

### 6. BELANGRIJK — `helpdesk-notify` wordt nergens aangeroepen
Geen trigger of hook roept de notify-functie aan bij nieuwe tickets, escalatie, oplossing, of toewijzing. SendGrid-verzending is bovendien nog niet ingebouwd (nu alleen `console.log`).

### 7. BELANGRIJK — Historie wordt nergens automatisch gelogd
`useLogHistorie` hook bestaat maar wordt **nergens aangeroepen**. Geen DB-trigger logt status/prioriteit/toewijzing-wijzigingen. HistorieTab blijft leeg.

### 8. BELANGRIJK — Service-bezoek koppelt NIET aan bestaande `afspraken`-tabel
Plan beloofde: "beide maken een record in bestaande `afspraken` tabel zodat planning-kalender ze automatisch toont". `useCreateServiceBezoek` schrijft alleen naar `helpdesk_service_bezoeken`. Monteurs zien de service-bezoeken NIET in de bestaande planning-kalender.

### 9. MEDIUM — Auto-save drafts hook bestaat, maar wordt nergens gebruikt
`useDraftAutosave.ts` is geschreven maar in geen enkel formulier (TicketNieuw, CommunicatieTab, OplossingTab) actief. Eis: "alle gegevens in tickets moeten automatisch worden opgeslagen".

### 10. MEDIUM — AI-functies niet end-to-end gevalideerd met echte data
Tabel `helpdesk_tickets` is leeg (geen testdata), waardoor we de troubleshooter-KB-zoek niet konden testen met echte input. Edge function code is correct (geanalyseerd), maar live test ontbreekt.

### 11. KLEIN — `OverzichtTab` toont rauwe UUIDs
Klant_id, lead_id, opdracht_id, etc. tonen alleen UUID — geen naam, geen klikbare link. Backoffice ziet niets bruikbaars.

### 12. KLEIN — TicketNieuw heeft geen "doorzetten naar collega" / technisch advies vragen
Eis: "Backoffice moet in een ticket technisch advies kunnen vragen aan een installateur en de tickets ook kunnen doorzetten naar andere collegas". Veld `toegewezen_aan` bestaat maar er is geen UI om te wijzigen na aanmaken.

## Plan om alle gaps te fixen (4 onderdelen)

### A. Cross-module integratie (gaps 1, 3, 11)
- Knop "Ticket aanmaken" toevoegen aan `OpdrachtDetail`, `Installaties`-detail, `FactuurDetail`, `KlantDetail` met query-params voor `bron`, `klant_id`, `opdracht_id` etc.
- TicketNieuw uitbreiden: bij aanwezig `opdracht_id` → fetch order + product → vul `product_categorie/merk/type/installatiejaar` automatisch
- `OverzichtTab` rewrite: fetch klant/order/installatie/factuur op basis van IDs en toon naam + link

### B. Klant-zoek + duplicaatcheck (gap 2)
- Nieuwe component `KlantZoekDuplicaat.tsx` (hergebruik patroon van `LeadSearchInput`)
- Edge function `helpdesk-klant-duplicaat-check`: zoekt op email/telefoon/adres en geeft top-3 matches terug
- "Nieuwe klant aanmaken" inline form als geen match

### C. Tickets-overzicht uitbreiden (gap 4)
- Filter-bar: status (multi), prioriteit, type, "mijn tickets", "alleen escalaties"
- Tabs of toggle: Lijst-view ↔ Kanban-view (per status-kolom)
- Snel-filter chips: "Hoge prio", "Storingen", "SLA overschreden", "Wacht op klant"

### D. Notificaties + historie + planning-koppeling (gaps 5, 6, 7, 8, 9, 12)
- Nieuwe pagina/tab `/instellingen` → "Helpdesk notificaties": ontvangers + 6 toggles + SLA-uren per prio
- DB-trigger `log_helpdesk_ticket_changes()` op `helpdesk_tickets` UPDATE → schrijft naar `helpdesk_ticket_historie`
- DB-trigger `notify_helpdesk_events()` op INSERT/UPDATE → invoke `helpdesk-notify` via `pg_net` (of via client-side hook)
- `helpdesk-notify` uitbreiden: SendGrid-integratie consistent met bestaande `email-api-send` patroon
- `useCreateServiceBezoek` parallel insert in `afspraken`-tabel (type='service_bezoek' of 'storing') zodat planning-kalender ze toont
- TicketDetail-header: "Toewijzen aan…" select + "Doorzetten naar collega" actie
- Auto-save in OplossingTab + CommunicatieTab via `useDraftAutosave` activeren

### Bestanden (wijziging/nieuw)

| Bestand | Actie |
|---|---|
| `src/pages/OpdrachtDetail.tsx` | + "Ticket aanmaken" knop |
| `src/pages/FactuurDetail.tsx` | + "Ticket aanmaken" knop |
| `src/pages/KlantDetail.tsx` | + "Ticket aanmaken" knop |
| `src/pages/Installaties.tsx` (of detail) | + "Ticket aanmaken" knop |
| `src/pages/helpdesk/TicketNieuw.tsx` | + klant-zoek, + auto-fill productcontext, + duplicaatcheck-flow |
| `src/components/helpdesk/KlantZoekDuplicaat.tsx` | NIEUW |
| `src/pages/helpdesk/TicketsOverzicht.tsx` | + filter-bar, + Kanban toggle, + snelfilter-chips |
| `src/pages/helpdesk/TicketDetail/OverzichtTab.tsx` | rewrite — toon namen + klikbare links i.p.v. UUIDs |
| `src/pages/helpdesk/TicketDetail/index.tsx` | + "Toewijzen aan" select in header |
| `src/components/instellingen/HelpdeskNotificatieConfig.tsx` | NIEUW |
| `src/pages/Instellingen.tsx` | + tab "Helpdesk notificaties" |
| `src/hooks/helpdesk/useServiceBezoeken.ts` | parallel insert in `afspraken` |
| `supabase/functions/helpdesk-klant-duplicaat-check/index.ts` | NIEUW |
| `supabase/functions/helpdesk-notify/index.ts` | + SendGrid-verzending |
| `supabase/migrations/...` | nieuwe migratie: `log_helpdesk_ticket_changes` trigger + `notify_helpdesk_events` trigger op INSERT/UPDATE helpdesk_tickets |

## Bevestiging

- **Email verzending**: hergebruik bestaand SendGrid patroon uit `email-api-send`. Akkoord?
- **Kanban view in tickets-overzicht**: standaard "Lijst", toggle naar Kanban per status-kolom (consistent met `Leads.tsx`). Akkoord?
- **Service-bezoek in `afspraken`**: dubbel-write (helpdesk_service_bezoeken + afspraken) zodat de bestaande planning-kalender de bezoeken automatisch toont. Akkoord?
- **AI live-test**: na fix van bovenstaande zal ik in de preview een testticket aanmaken en de Foutcode-Analyzer + Troubleshooter end-to-end laten lopen. Akkoord?

