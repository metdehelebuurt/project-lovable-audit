

## Plan — Klantfeedback deel 2: werkvoorbereiding, historie, taken-met-planning, actiecentrum

Vier samenhangende uitbreidingen die het platform van reactief naar proactief brengen.

---

### 1. Installatie-checklist & waarschuwingen voor werkvoorbereiding

**Probleem nu**: Een installatie kan ingepland worden zonder dat de schouw is afgerond, zonder dat de batterij/panelen geleverd zijn, zonder serienummers, zonder klantbevestiging. De backoffice merkt het pas op de dag zelf.

**Wat er komt**:

**A. Automatische gereedheidscheck (computed, geen losse data)**
Een nieuwe component `InstallatieGereedheidsCard` bovenin het overzicht-tabblad toont een checklist met live-status. Elk item is **groen / oranje / rood** met klikbare deeplinks:
- ✓ Schouw uitgevoerd (status `uitgevoerd`) — anders rood + link naar schouw
- ✓ Klant bevestigd (`bevestiging_verzonden_op` + `monteur_geaccepteerd_op`)
- ✓ Monteur toegewezen
- ✓ Werkadres ingevuld
- ✓ Producten gekoppeld (≥1 regel)
- ✓ Voorraad beschikbaar — vergelijk producten met `get_voorraad_stand()` per product_id
- ✓ Levering binnen — als alle producten gekoppeld zijn aan een ontvangen inkoopontvangst, of er liggen nog open zendingen
- ✓ Serienummers ingevoerd (alleen vereist bij status ≥ `gereed`)
- ✓ Werkomschrijving + geplande datum/tijd

**B. Configureerbare werkvoorbereidingschecklist per partner**
- Nieuwe tabel `installatie_checklist_templates` (partner_id, item_key, label, vereist_voor_status, blokkerend bool, volgorde) — partners kunnen extra eigen items toevoegen ("Steiger besteld", "Net-aanvraag ingediend", "Klant geïnformeerd over parkeerplaats").
- Per installatie een tabel `installatie_checklist_items` (installatie_id, item_key, voltooid_op, voltooid_door, notitie) waarin afvinkbare items worden bijgehouden.
- Nieuw tabblad **Werkvoorbereiding** met de hele lijst, afvinkbaar door backoffice.

**C. Blokkades op statusovergangen**
- Backend trigger `validate_installatie_status_overgang`: blokkeert overgang naar `bevestigd` of `in_uitvoering` als blokkerende checklist-items niet voltooid zijn. Foutmelding noemt het ontbrekende item.
- Frontend toont vóór statuswijziging een waarschuwingsdialog met de openstaande items en optie "Toch doorgaan" (alleen partner_admin kan negeren, met reden in audit-log).

**D. Globale waarschuwingsbalk**
Bovenin de detailpagina een gele/rode strook met aantal openstaande blokkades en de eerstvolgende geplande datum, zodat het direct opvalt zonder door tabbladen te klikken.

---

### 2. Uitgebreide historielogging met gebruiker overal

**Probleem nu**: Historie bestaat voor `installaties`, `helpdesk_tickets`, `financiele_documenten`, en `audit_log` voor users, maar niet voor `leads`, `offertes`, `schouwen`, `opdrachten`, `klanten`, `taken`. Bovendien wordt in bestaande historie alleen `actor_id`/`user_id` opgeslagen — geen denormalised naam, dus bij verwijderde users verschijnt "—".

**Wat er komt**:

**A. Universele historie-tabel `entiteit_historie`**
Eén tabel die alles vangt — voorkomt het ontstaan van vijf nieuwe per-entiteit-tabellen:
```
entiteit_historie (
  id, partner_id, entiteit_type text, entiteit_id uuid,
  actor_id uuid, actor_naam text, actor_rol text,  -- gedenormaliseerd
  actie text, veld text, oude_waarde text, nieuwe_waarde text,
  details jsonb, ip inet, user_agent text, created_at
)
```
Naam/rol worden bij insert vastgelegd zodat ze blijven leesbaar ook als een user later verwijderd wordt.

**B. Triggers voor leads, offertes, schouwen, opdrachten, klanten, taken**
- Per tabel een trigger `log_<tabel>_changes` die belangrijke velden tracked: status, eigenaar, bedrag, datum, geannuleerd_reden enz.
- Bestaande historie-triggers (`log_helpdesk_ticket_changes`, `log_installatie_changes`, `log_factuur_changes`) worden uitgebreid met denormalised actor_naam + rol via een helper-functie `current_actor_meta()`.

**C. UI: gedeeld component `EntiteitHistorieTab`**
- Eén React-component (max 200 regels) die `entiteit_type` + `entiteit_id` neemt, kan gebruikt worden in installatie, lead, offerte, schouw, opdracht, klant en ticket detail.
- Toont per regel: avatar/initialen + naam + rol + tijdstip + actie + diff. Gegroepeerd per dag.
- Vervangt op termijn de losse `InstallatieHistorieTab` en `HistorieTab` van tickets — beide blijven backwards compatible totdat de migratie van bestaande rows klaar is.

**D. Backfill-script als onderdeel van de migratie**
Bestaande rijen in `installatie_historie`, `helpdesk_ticket_historie` en `factuur_historie` worden gekopieerd naar `entiteit_historie` met opgezochte naam, zodat alle historie op één plek vindbaar is.

---

### 3. Taken inplannen vanuit de takendialog

**Probleem nu**: `helpdesk_ticket_taken` heeft een `deadline` maar verschijnt niet in de planning-kalender. Taken leven los van de agenda van de gebruiker.

**Wat er komt**:

**A. Schema-uitbreiding op `helpdesk_ticket_taken`**
- `inplannen_in_agenda` boolean default false
- `geplande_datum` date
- `geplande_starttijd` time, `geplande_eindtijd` time
- `geschatte_duur_minuten` integer
- `agenda_user_id` uuid (default = `toegewezen_aan`)
Geen aparte `afspraken`-rij — de planning-pagina leest direct uit taken via een UNION.

**B. TaakDialog uitbreiden**
Onder het bestaande deadline-veld een schakelaar **"Inplannen in agenda"**. Bij activatie verschijnt:
- Datum + starttijd + eindtijd (default duur 30 min)
- Toegewezen aan (dropdown van team-users) — valt terug op `toegewezen_aan`
- Optie "Herinnering 1 dag van tevoren" (creëert notificatie via cron)

**C. Planning-kalender uitbreiden**
- `Planning.tsx` haalt naast schouwen/installaties/afspraken óók taken op met `inplannen_in_agenda = true`.
- Kleur: lila (taken) — naast blauw (schouwen), oranje (installaties), groen/violet (afspraken).
- Klik op taak-event → opent de bijbehorende ticket detail (`/helpdesk/tickets/{ticket_id}`) op het Taken-tabblad.
- iCal-feed (`planning-ical-feed`) wordt uitgebreid met taken voor de eigenaar.

**D. Standalone taken (zonder ticket)**
Optioneel: knop "Nieuwe taak" rechtstreeks vanaf het Actiecentrum (zie 4) maakt een taak aan zonder ticket-koppeling. Hiervoor maken we `ticket_id` in `helpdesk_ticket_taken` nullable en hernoemen we de tabel niet (compatibility) maar voegen een view `taken_view` toe die zowel ticket-taken als losse taken combineert.

---

### 4. Actiecentrum — één plek voor alles wat aandacht vereist

**Probleem nu**: Notificaties, openstaande taken, terugbel-leads, ongelezen berichten en escalaties leven in vijf verschillende schermen. Backoffice mist regelmatig zaken.

**Wat er komt**:

**A. Nieuwe pagina `/actiecentrum`**
Volledige pagina (geen popover), geopend via een nieuwe **"Actiecentrum"-knop** in de AppHeader naast de bell-icon, met een totaal-badge (alle openstaande items). Ook bereikbaar via sidebar.

**B. Layout: 5 kolommen / kaarten**
Responsive grid (mobiel: stapel; tablet: 2 kolommen; desktop: 5 kolommen):

1. **Notificaties** — alle ongelezen uit `notificaties` (gegroepeerd per type), klikbaar → markeert gelezen + navigeert.
2. **Mijn taken** — uit `helpdesk_ticket_taken` waar `toegewezen_aan = mij` en `status` ∈ {open, in_behandeling}, gesorteerd op deadline. Snelacties: ✓ voltooid, ⏰ uitstellen 1 dag, → open ticket.
3. **Berichten** — ongelezen uit `email_berichten` (where `klant_id` of `lead_id` aan jou toegewezen) + nieuwste `helpdesk_ticket_berichten` op tickets die jij beheert + ongelezen `offerte_berichten` op jouw offertes.
4. **Terugbel-afspraken** — leads met `lead_status` ∈ {`terugbellen`, `geen_gehoor`, `voicemail`} waar jij `owner_user_id` van bent, gesorteerd op `volgende_actie_op` (of `updated_at`). Snelactie: "Bel nu" (`tel:`-link), "Markeer gesproken", "Verzet 1 dag".
5. **Aandacht vereist** — verzamelpot:
   - Geëscaleerde tickets toegewezen aan jou
   - Installaties zonder schouw die binnen 7 dagen gepland staan (uit Gereedheidscheck)
   - Offertes verzonden > 7 dagen geleden zonder reactie
   - Facturen vervallen
   - Voorraadtekorten op gekoppelde producten van komende installaties

**C. Filters & realtime**
- Bovenin: filter "Alleen mijn items" / "Hele team" (alleen voor backoffice/partner_admin), datumbereik (vandaag/deze week/alles), sorteer op urgentie.
- Realtime via Supabase channels op `notificaties`, `helpdesk_ticket_taken`, `email_berichten` — counter en kaart-inhoud verversen vanzelf.
- Nieuwe hook `useActiecentrum` (≤200 regels) bundelt de queries via `useQueries` en exposeert getelde counts per kaart.

**D. Snelacties zonder context-switch**
- Vanaf elke kaart: hover-acties zoals "Markeer gedaan", "Plan in", "Stuur bericht" — opent bestaande dialogs (TaakDialog, AfspraakDialog, EmailCompose) als overlay zonder de pagina te verlaten.

**E. Persoonlijke samenvatting bovenaan**
Begroetingsblok ("Goedemorgen Roshny, je hebt 7 openstaande items, 2 taken vandaag en 3 escalaties"). Geeft direct gevoel van controle.

---

### Bestanden

**Database (3 migraties)**
- `installatie_checklist_templates` + `installatie_checklist_items` + status-overgang trigger + denormalised actor in bestaande historie-triggers
- `entiteit_historie` + triggers voor leads/offertes/schouwen/opdrachten/klanten + backfill bestaande historie
- Uitbreiding `helpdesk_ticket_taken` met agenda-velden + `ticket_id` nullable

**Frontend — nieuw**
- `src/components/installaties/InstallatieGereedheidsCard.tsx`
- `src/components/installaties/InstallatieWerkvoorbereidingTab.tsx`
- `src/components/historie/EntiteitHistorieTab.tsx` (gedeeld)
- `src/pages/Actiecentrum/index.tsx` + 5 sub-kaarten (`NotificatiesKaart`, `TakenKaart`, `BerichtenKaart`, `TerugbelKaart`, `AandachtKaart`)
- `src/hooks/useActiecentrum.ts`
- `src/hooks/installaties/useInstallatieGereedheid.ts`

**Frontend — aanpassingen**
- `src/components/helpdesk/TaakDialog.tsx` — agenda-schakelaar + velden
- `src/pages/Planning.tsx` — taken-events erbij
- `src/components/AppHeader.tsx` — Actiecentrum-knop met telbadge
- `src/components/AppSidebar.tsx` — link naar Actiecentrum onderaan Overzicht
- `src/pages/InstallatieDetail.tsx` — Werkvoorbereiding-tab + Gereedheidscard
- `src/pages/LeadDetail.tsx`, `OfferteDetail.tsx`, `SchouwDetail.tsx`, `OpdrachtDetail.tsx`, `KlantDetail.tsx` — `EntiteitHistorieTab` toevoegen
- `src/App.tsx` — route `/actiecentrum`
- `supabase/functions/planning-ical-feed/index.ts` — taken in feed

### Niet-doelen
- Geen routeoptimalisatie of geocoding voor de planning.
- Geen herontwerp van bestaande historie-tabbladen — die blijven werken naast de nieuwe gedeelde versie.
- Geen automatische taken-templates per status (kan in vervolg).
- Geen mobiele app voor het Actiecentrum (wel responsive web).
- Geen SLA op taken (deadline blijft het mechanisme).

