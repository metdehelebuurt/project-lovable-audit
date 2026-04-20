

# Plan: Helpdesk module met AI troubleshooter, knowledge base & service planning

## Doel

Een volledige helpdesk omgeving voor backoffice, monteurs en installateurs met tickets, AI-troubleshooting, knowledge base, service-bezoek planning en strikte multi-tenant isolatie.

## Architectuur in één blik

```text
┌─────────────────────────────────────────────────────────┐
│  /helpdesk                                              │
│  ├─ Dashboard (KPI's, hoge prio, escalaties, planning)  │
│  ├─ Tickets (lijst + filters + Kanban)                  │
│  ├─ Ticket Detail                                       │
│  │   ├─ Klant + Order + Product context                 │
│  │   ├─ Probleem Analyzer (AI, productspecifiek)        │
│  │   ├─ Foutcode Analyzer (AI, merk-aware)              │
│  │   ├─ Troubleshooter (AI, KB-aware)                   │
│  │   ├─ Communicatie (intern + klant)                   │
│  │   ├─ Bijlagen (foto/video/logs)                      │
│  │   ├─ Service-afspraak (monteur inplannen)            │
│  │   ├─ Taken                                           │
│  │   ├─ Oplossing (verplicht bij sluiten)               │
│  │   └─ Historie / audit log                            │
│  └─ Knowledge Base (per partner, AI-gegenereerd)        │
└─────────────────────────────────────────────────────────┘
```

## Database schema

Nieuwe tabellen, allemaal met `partner_id` + RLS voor strikte isolatie tussen partners.

| Tabel | Doel |
|---|---|
| `helpdesk_tickets` | Hoofd-record: nummer (TKT-YYYY-0001), titel, omschrijving, status, prioriteit, type (`vraag`/`klacht`/`storing`/`service_bezoek`), kanaal, klant_id, opdracht_id, installatie_id, factuur_id, product (merk/type/installatiejaar/categorie), foutcode, toegewezen_aan, gemaakt_door, bron_locatie (`order`/`installatie`/`factuur`/`direct`), SLA-deadline, escalatie-flag |
| `helpdesk_ticket_berichten` | Communicatie-thread (intern of klant-zichtbaar), richting, auteur, body, bijlagen |
| `helpdesk_ticket_bijlagen` | Foto's, video's, logbestanden (storage bucket `helpdesk-media`) |
| `helpdesk_ticket_taken` | Taken met deelbaarheid (toegewezen_aan, status, deadline) |
| `helpdesk_ticket_historie` | Append-only audit log van alle wijzigingen |
| `helpdesk_ticket_ai_sessies` | Opgeslagen AI-conversaties (foutcode/troubleshooter), inclusief vragen, antwoorden, gerelateerde tickets |
| `helpdesk_service_bezoeken` | Koppeling ticket → afspraak in bestaande `afspraken`-tabel met type `service_bezoek` of `storing`, monteur, aankomst/vertrek, urenverantwoording, klant-handtekening |
| `helpdesk_kennis_artikelen` | KB-artikelen per partner: titel, samenvatting, probleem, oplossing, productcategorie, merk, tags, bron_ticket_id, AI-gegenereerd, embeddings |
| `helpdesk_kennis_media` | Foto's/video's gekoppeld aan artikelen (overgenomen uit tickets) |
| `helpdesk_notificatie_config` | Per partner: welke events triggeren mail (nieuw ticket, escalatie, toewijzing, klant-reactie, etc.) |
| `helpdesk_drafts` | Auto-save concepten per gebruiker zodat niets verloren gaat bij verbindingsverlies |

Bestaande tabellen die we uitbreiden:
- `afspraken`: `type` enum krijgt `service_bezoek` en `storing` waarden
- `notificaties`: nieuwe `entity_type` waarden voor helpdesk

## RLS & multi-tenant isolatie (kritiek)

Elke nieuwe tabel: `partner_id` verplicht + policy `partner_id = get_user_partner_id(auth.uid())`. Dit garandeert dat partner A nooit tickets, KB-artikelen of AI-antwoorden van partner B ziet — ook niet via de AI-troubleshooter (KB-zoekopdrachten gefilterd op `partner_id` voordat ze naar de LLM gaan).

Installateurs zien alleen tickets waar zij toegewezen zijn of die zij zelf aanmaakten (consistent met bestaande `installateur`-rol patroon).

## Edge Functions

| Functie | Taak |
|---|---|
| `helpdesk-ai-foutcode` | Zoekt info over foutcode + merk via Gemini + web search, geeft oplossingsstappen |
| `helpdesk-ai-troubleshooter` | Stelt vervolgvragen, doorzoekt KB van **alleen deze partner**, retourneert suggesties + gerelateerde tickets |
| `helpdesk-ai-analyze-bijlage` | Analyseert geüploade logs/foto's (Gemini multimodal) |
| `helpdesk-ai-genereer-kbartikel` | Maakt na ticket-sluiting een KB-artikel van probleem + oplossing + media |
| `helpdesk-notify` | Verstuurt mail-notificaties op basis van `helpdesk_notificatie_config` (SendGrid, bestaand patroon) |
| `helpdesk-klant-duplicaat-check` | Check op email/telefoon/adres voordat nieuwe klant wordt aangemaakt vanuit ticket |

Alle functies gebruiken Lovable AI (`google/gemini-2.5-pro` voor zware analyse, `gemini-2.5-flash` voor snelle vragen) — geen externe API-key nodig.

## UI / pagina's & componenten

Nieuwe routes onder `ProtectedRoute`:
- `/helpdesk` — dashboard (KPI cards, hoge-prio lijst, escalaties, vandaag geplande service-bezoeken)
- `/helpdesk/tickets` — overzicht met filters (status, prio, type, toegewezen, klant)
- `/helpdesk/tickets/nieuw` — wizard met klant-zoek + duplicaatcheck
- `/helpdesk/tickets/:id` — detail met tabs: Overzicht / Analyzer / Communicatie / Bijlagen / Taken / Planning / Oplossing / Historie
- `/helpdesk/kennisbank` — KB browser met search + categorie-filter
- `/helpdesk/kennisbank/:id` — artikel-weergave

Sidebar krijgt nieuwe groep "Helpdesk" met zichtbaarheid per rol (superadmin, partner_admin, partner_staff, adviseur, installateur).

Vanuit bestaande pagina's komt knop "Ticket aanmaken":
- `OpdrachtDetail` → ticket met `bron_locatie='order'` + voorgevulde klant/product
- `Installaties` detail → `bron_locatie='installatie'`
- `FactuurDetail` → `bron_locatie='factuur'`

## Belangrijkste functionele details

**Probleem Analyzer per productcategorie**: dynamische velden (zonnepanelen, warmtepomp, batterij, laadpaal, isolatie) — AI-prompt past zich aan op basis van categorie + merk en stelt categorie-specifieke checklist-vragen.

**Foutcode Analyzer**: invoer = merk + foutcode → AI-call → oplossingsstappen + bron-links. Resultaat opgeslagen in `helpdesk_ticket_ai_sessies` zodat troubleshooter er later op kan voortbouwen.

**Troubleshooter met KB-herkenning**: voordat naar LLM wordt gestuurd, doen we een vector-search (pgvector) over `helpdesk_kennis_artikelen` van **alleen deze partner**. Treffers worden als context meegegeven en in UI getoond als "Eerder voorgekomen tickets".

**Auto-save**: alle invoer in ticket-formulieren wordt elke 5s naar `helpdesk_drafts` weggeschreven met `user_id + ticket_id` key. Bij heropenen → herstel.

**Service-bezoek vs storing**: beide maken een record in bestaande `afspraken` tabel zodat de planning-kalender ze automatisch toont (storing = rood, service_bezoek = oranje, consistent met bestaande blauw=schouw / geel=installatie).

**Urenverantwoording monteur**: aankomsttijd + vertrektijd + werkzaamheden + verplicht oplossing-veld vóór klant-handtekening (hergebruik bestaand `SignaturePad` component).

**Knowledge Base bouwen**: na status `opgelost` triggert `helpdesk-ai-genereer-kbartikel` automatisch — schrijft artikel concept, partner_admin keurt goed of past aan voordat het zichtbaar wordt voor de rest van het bedrijf. Foto's/video's uit ticket worden meegekopieerd naar `helpdesk_kennis_media`.

**Notificaties**: per partner instelbaar in `/instellingen` (nieuwe tab "Helpdesk notificaties"): welke events → email naar wie. Integreert met bestaand real-time `notificaties`-systeem voor in-app meldingen.

**Escalatie & SLA**: tickets met prio `urgent`/`storing` krijgen automatisch SLA-deadline; cron-achtige check (via `helpdesk-notify` op interval) markeert overschrijdingen als `geescaleerd`.

## Bestanden (indicatief, alles binnen 800-regel limiet)

```text
src/pages/helpdesk/
  Dashboard.tsx
  TicketsOverzicht.tsx
  TicketNieuw.tsx
  TicketDetail/
    index.tsx
    OverzichtTab.tsx
    AnalyzerTab.tsx
    CommunicatieTab.tsx
    BijlagenTab.tsx
    TakenTab.tsx
    PlanningTab.tsx
    OplossingTab.tsx
    HistorieTab.tsx
  Kennisbank.tsx
  KennisArtikel.tsx
src/components/helpdesk/
  TicketCard.tsx
  PrioriteitBadge.tsx
  StatusBadge.tsx
  KlantZoekDuplicaat.tsx
  ProductContextPanel.tsx
  FoutcodeAnalyzer.tsx
  Troubleshooter.tsx
  AIQuestionFlow.tsx
  GerelateerdeTickets.tsx
  ServiceBezoekDialog.tsx
  StoringDialog.tsx
  UrenVerantwoording.tsx
  TaakDialog.tsx
  AutoSaveIndicator.tsx
  NotificatieConfig.tsx
src/hooks/helpdesk/
  useTickets.ts
  useTicketDetail.ts
  useDraftAutosave.ts
  useKennisbank.ts
supabase/functions/
  helpdesk-ai-foutcode/
  helpdesk-ai-troubleshooter/
  helpdesk-ai-analyze-bijlage/
  helpdesk-ai-genereer-kbartikel/
  helpdesk-notify/
  helpdesk-klant-duplicaat-check/
supabase/migrations/  (één migratie voor alle nieuwe tabellen + RLS + storage bucket)
```

## Implementatie-volgorde (3 fases)

**Fase 1 – Fundament (deze loop)**
1. Database migratie: alle tabellen, enums, RLS, storage bucket `helpdesk-media`, pgvector extension
2. Sidebar menu + routes + lege pagina's
3. Ticket CRUD + overzicht + detail (tabs zonder AI)
4. Klant-koppeling met duplicaatcheck + product context vanuit order/installatie/factuur
5. Communicatie-thread + bijlagen
6. Auto-save drafts
7. Notificatie-config UI + `helpdesk-notify` edge function

**Fase 2 – AI & Service**
8. Foutcode Analyzer + Troubleshooter edge functions + UI
9. Service-bezoek/storing → koppeling met `afspraken` + planning-kalender
10. Urenverantwoording + handtekening + verplichte oplossing
11. Auto-genereer KB artikel na sluiting + KB browser

**Fase 3 – Verfijning**
12. Dashboard met KPI's + escalatie-detectie
13. Taken-systeem + deelbaarheid
14. Vector-search op KB voor troubleshooter
15. Bijlage-AI-analyse (logs, foto's)

## Open punten ter bevestiging

- **Live foutcode-bronnen**: AI gebruikt training-kennis + optioneel web search via bestaande Firecrawl-connector. Akkoord?
- **KB-zichtbaarheid**: artikelen na AI-generatie eerst concept → partner_admin moet goedkeuren voor publicatie. Akkoord?
- **Storing-notificaties**: bij aanmaken `type=storing` automatisch SMS/push naar dichtstbijzijnde monteur? Of voorlopig alleen email + in-app notificatie?
- **SLA-tijden**: standaard waarden per prioriteit (bijv. urgent=4u, hoog=1d, normaal=3d, laag=7d) of per partner instelbaar in fase 1?

