

## Plan — Frontend voor werkvoorbereiding, historie, taken-planning en actiecentrum

De database staat klaar (checklist-tabellen, `entiteit_historie`, agenda-velden op taken). Nu de frontend in vier samenhangende blokken.

---

### 1. Installatie-werkvoorbereiding (UI)

**Hook `useInstallatieGereedheid.ts`** — combineert live-data tot één status-object:
- schouw_status, klant_bevestigd, monteur_toegewezen, werkadres_compleet
- producten_gekoppeld, voorraad_ok (per product `get_voorraad_stand`), serienummers_ingevoerd
- checklist_items (uit `installatie_checklist_items`) + open blokkades

**Component `InstallatieGereedheidsCard.tsx`** — bovenin het Overzicht-tab. Per item: groen/oranje/rood icoon + label + deeplink. Toont totaal-score "7 van 9 gereed".

**Component `InstallatieWerkvoorbereidingTab.tsx`** — nieuw tabblad in `InstallatieDetail`. Lijst van checklist-items (afvinkbaar door backoffice/partner_admin), knop "Item toevoegen", knop "Template toepassen" (laadt items uit `installatie_checklist_templates`).

**Component `WaarschuwingBalk.tsx`** — gele/rode strook bovenin `InstallatieDetail` als blokkades open staan vóór de geplande datum.

**Statusovergang-dialog** — wrapper rond bestaande status-wijzigers in `InstallatieHeader`/`InstallatieActieBalk`: pre-check op blokkerende items, toont waarschuwingsdialog. Alleen partner_admin kan "Toch doorgaan" (logt reden via `log_entity_change`).

**Instellingen-pagina `ChecklistTemplates.tsx`** — partner_admin beheert templates per partner (label, blokkerend, vereist-voor-status, volgorde).

---

### 2. Universele historie-tab

**Hook `useEntiteitHistorie.ts`** — query op `entiteit_historie` waar `entiteit_type` + `entiteit_id` matchen, gesorteerd nieuw→oud.

**Component `EntiteitHistorieTab.tsx`** — gedeeld, max 200 regels:
- Groepeert per dag
- Per regel: avatar (initialen) + `actor_naam` + `actor_rol` + tijdstip + actielabel + diff (oud → nieuw)
- Vertaaltabel voor `actie`-codes naar Nederlands ("status_gewijzigd" → "Status gewijzigd")

**Inbedding** in:
- `LeadDetail.tsx` (nieuw tab "Historie")
- `OfferteDetail.tsx` (nieuw tab "Historie")
- `SchouwDetail.tsx` (nieuw tab)
- `OpdrachtDetail.tsx` (nieuw tab)
- `KlantDetail.tsx` (nieuw tab)
- `InstallatieDetail.tsx` — bestaande `InstallatieHistorieTab` blijft, maar krijgt onderaan een sectie "Volledige tijdlijn" met de unified view (backwards-compatible)
- `TicketDetail` — idem in HistorieTab

---

### 3. Taken inplannen + planning-kalender

**`TaakDialog.tsx` uitbreiden**:
- Schakelaar "Inplannen in agenda"
- Bij actief: datum + starttijd + eindtijd (default duur 30 min) + dropdown `agenda_user_id` (team-users) + checkbox "Herinnering 1 dag van tevoren"
- Schrijft `inplannen_in_agenda`, `geplande_datum`, `geplande_starttijd`, `geplande_eindtijd`, `agenda_user_id` weg.

**`Planning.tsx` uitbreiden**:
- Extra query op `helpdesk_ticket_taken` waar `inplannen_in_agenda = true` (en `agenda_user_id` matcht filter).
- Lila events naast bestaande blauw/oranje/groen.
- Klik → navigeert naar `/helpdesk/tickets/{ticket_id}` op Taken-tab; bij standalone-taak (geen ticket_id) → opent TaakDialog overlay.
- Legenda-update.

**`planning-ical-feed/index.ts`** — taken voor de eigenaar in feed opnemen (VEVENT met titel + ticket-link in description).

**Standalone taken**: `TaakDialog` accepteert `ticket_id = null` zodat het Actiecentrum direct losse taken kan aanmaken.

---

### 4. Actiecentrum

**Route `/actiecentrum`** (toegevoegd in `App.tsx`, beschermd voor backoffice/partner_admin/partner_staff/adviseur).

**Hook `useActiecentrum.ts`** (≤200 regels) — bundelt via `useQueries`:
- `notificaties` ongelezen voor `auth.uid()`
- `helpdesk_ticket_taken` waar `toegewezen_aan = mij` & status open/in_behandeling
- ongelezen `email_berichten` + `helpdesk_ticket_berichten` (op tickets die ik beheer) + `offerte_berichten`
- leads met `lead_status` ∈ {terugbellen, geen_gehoor, voicemail} & `owner_user_id = mij`
- aandacht-bucket: geëscaleerde tickets (mij), installaties zonder schouw < 7 dagen, offertes >7 dagen verzonden zonder reactie, vervallen facturen
- Realtime channels op `notificaties`, `helpdesk_ticket_taken`, `email_berichten` voor live counts

**Pagina `Actiecentrum/index.tsx`**:
- Begroetingsblok bovenin met telling
- Filterbalk: "Mijn items"/"Hele team" (alleen admin/backoffice), datumbereik, sortering
- Responsive grid (mobiel stapel, tablet 2 kol, desktop 5 kol)
- Sub-componenten: `NotificatiesKaart`, `TakenKaart`, `BerichtenKaart`, `TerugbelKaart`, `AandachtKaart` (elk eigen bestand, ≤150 regels)
- Snelacties per kaart: ✓ voltooid, uitstellen +1 dag, "Bel nu" (`tel:`-link), open detailpagina

**Header-knop** in `AppHeader.tsx`: nieuwe "Actiecentrum"-button (icoon `Inbox` of `LayoutDashboard`) met telbadge naast de bell.

**Sidebar-link** in `AppSidebar.tsx` onderaan groep "Overzicht".

---

### Bestanden

**Nieuw**
- `src/hooks/installaties/useInstallatieGereedheid.ts`
- `src/components/installaties/InstallatieGereedheidsCard.tsx`
- `src/components/installaties/InstallatieWerkvoorbereidingTab.tsx`
- `src/components/installaties/WaarschuwingBalk.tsx`
- `src/components/installaties/StatusOvergangDialog.tsx`
- `src/pages/instellingen/ChecklistTemplates.tsx`
- `src/hooks/useEntiteitHistorie.ts`
- `src/components/historie/EntiteitHistorieTab.tsx`
- `src/hooks/useActiecentrum.ts`
- `src/pages/Actiecentrum/index.tsx`
- `src/pages/Actiecentrum/NotificatiesKaart.tsx`
- `src/pages/Actiecentrum/TakenKaart.tsx`
- `src/pages/Actiecentrum/BerichtenKaart.tsx`
- `src/pages/Actiecentrum/TerugbelKaart.tsx`
- `src/pages/Actiecentrum/AandachtKaart.tsx`

**Aangepast**
- `src/components/helpdesk/TaakDialog.tsx` — agenda-velden
- `src/pages/Planning.tsx` — taken-events
- `src/components/AppHeader.tsx` — Actiecentrum-knop met badge
- `src/components/AppSidebar.tsx` — link
- `src/pages/InstallatieDetail.tsx` — gereedheidscard, werkvoorbereiding-tab, waarschuwingsbalk
- `src/pages/LeadDetail.tsx`, `OfferteDetail.tsx`, `SchouwDetail.tsx`, `OpdrachtDetail.tsx`, `KlantDetail.tsx`, `TicketDetail/index.tsx` — historie-tab
- `src/App.tsx` — `/actiecentrum` + `/instellingen/checklist-templates`
- `supabase/functions/planning-ical-feed/index.ts` — taken in feed

### Niet-doelen
- Geen routeoptimalisatie of geocoding op planning.
- Geen vervanging van bestaande InstallatieHistorieTab/HistorieTab; nieuwe view komt erbij.
- Geen mobiele app — wel responsive web.
- Geen automatische taken-templates per status (later).

