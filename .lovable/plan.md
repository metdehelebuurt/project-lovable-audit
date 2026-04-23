

## Analyse — Installateur kan nog niet volwaardig werken

Je vroeg een grondige analyse van de installateur-ervaring (toegewezen installaties, opdrachten, etc.). Hieronder de bevindingen en het verbeterplan.

### Gevonden knelpunten

**1. Routes & navigatie (gedeeltelijk geblokkeerd)**
- `/opleveringen/nieuw` en `/opleveringen/:id` staan wel open voor `installateur`, maar voor de **monteursnelweg** ontbreekt de doorklik vanuit het mobiele werkscherm in sommige statussen.
- `/installaties/:id` (kantoorweergave) is open voor installateur, maar tabs als "Communicatie" en "Documentatie" tonen knoppen die de installateur niet hoort/mag bedienen.
- Sidebar: "Voorraad", "Producten" en "Documenten" staan wel in het menu, maar `OpdrachtDetail` toont retour-/factuur-/pakbon-knoppen die voor monteur falen door RLS — geen role-gating in de UI.

**2. Dashboard te leeg en niet werkbaar**
- Installateur-dashboard toont enkel 2 kale telkaarten ("Verkooporders", "Gepland"). Geen agenda voor vandaag, geen lijst toegewezen installaties, geen openstaande opleverrapporten, geen knoppen naar werkscherm.

**3. Lijstweergaven niet gefilterd op "mijn werk"**
- `Installaties.tsx`: query haalt **alle** installaties van de partner; RLS geeft alleen die van de installateur door, maar de UI heeft géén "mijn open werk" / "vandaag" / "deze week" filters. Geen sortering op startdatum oplopend.
- `Opdrachten.tsx`: zelfde verhaal — installateur ziet alle opdrachten via tabel zonder onderscheid welke aan hem zijn toegewezen (`toegewezen_monteur_id`). RLS filtert wel maar UX is verwarrend.

**4. Planning/agenda mist installateur-perspectief**
- `Planning.tsx`: `isAdmin` is alleen `partner_admin`/`partner_staff`, dus installateur ziet `mijnAgenda=true` standaard, **maar** filter logica filtert op `adviseur_id`. Installaties worden niet gefilterd op `installateur_id` — installateur ziet dus alle installaties van het hele partnerteam i.p.v. enkel zijn eigen. Geen "morgen / komende 7 dagen" focus-view voor monteur.

**5. RLS/permissie-inconsistenties**
- `opdrachten.UPDATE` policy laat installateur **niet** updaten (alleen partner_admin/partner_staff/adviseur). Voor de monteur in OpdrachtDetail werkt geen enkele actie behalve lezen. Knoppen zoals "Annuleren", "Pakbon aanmaken", "Factuur aanmaken" falen stilzwijgend.
- `voorraad_mutaties.INSERT` is open voor partner-leden, maar de `VoorraadCorrectieDialog` heeft geen role-gating; installateur-gebruik bij gereedmelding (verbruikt materiaal) is nu niet ondersteund.
- `serienummers` (`product_serienummers`): installateur kan invullen, ✓.

**6. Werkscherm `/installaties/:id/werk` mist functies**
- Geen "pauzeren-> hervatten" met tijdregistratie zichtbaar voor monteur.
- Geen knop om snel een **storingsticket / probleem** aan te maken vanaf de werkplek (wel in de kantoorweergave).
- Notitie/foto-uploads ontbreken; monteur moet op desktop door tabs heen.
- Geen offline-/zwak-netwerk-indicator; gereedmelding faalt zonder retry.

**7. Kleine UX-issues**
- Dashboard-titel zegt "Mijn Verkooporders" — onlogisch voor installateur (zou "Mijn werk" moeten zijn, consistent met sidebar-label).
- Opleveringen-knop in monteurview toont alleen bij status `gereed/in_uitvoering`; een deel van monteurs werkt direct met de bevestigde-status; te restrictief.

---

### Verbeterplan

**Stap 1 — Rol-gefilterde lijstweergaven**
- `Installaties.tsx`: voor `rol==='installateur'` standaard filter "Mijn open werk" (status ∈ gepland/bevestigd/onderweg/in_uitvoering/gereed), sorteer oplopend op `geplande_startdatum`. Tabs: "Vandaag" / "Deze week" / "Open" / "Afgerond".
- `Opdrachten.tsx`: voor installateur enkel opdrachten met `toegewezen_monteur_id = profile.id` of waar `installatie_id` aan een eigen installatie hangt; verberg knoppen "Plannen / Factuur / Pakbon".

**Stap 2 — Installateur-dashboard**
- Vervang lege widgets door: "Vandaag" (tijdslijn van toegewezen installaties met kaart-link), "Komende 7 dagen", "Open opleverrapporten van mij", "Aan mij toegewezen tickets".
- Quick-action knoppen: "Naar werkscherm vandaag", "Nieuw opleverrapport", "Ticket aanmaken".

**Stap 3 — Planning**
- Behandel `installateur` net als adviseur: `mijnAgenda` filter ook op `installateur_id` voor installatie-events. Default voor installateur: week-view met enkel eigen werk.

**Stap 4 — RLS uitbreiden waar legitiem**
- Migratie: `opdrachten.UPDATE` policy uitbreiden zodat installateur status mag wijzigen op **eigen** opdracht (`toegewezen_monteur_id = auth.uid()`) maar alleen statusvelden, geen prijs/regels (afdwingen via trigger of velden whitelist).
- Geen verandering aan financiële tabellen (terecht alleen admin).

**Stap 5 — Role-gating in UI**
- `OpdrachtDetail`: verberg voor `installateur` de actieknoppen "Annuleren / Factuur / Pakbon / Schouw plannen / Installatie plannen". Toon alleen "Werkscherm openen", "Notitie toevoegen", "Ticket aanmaken", "Documentatie".
- `InstallatieDetail`: voor installateur tab "Communicatie" en "Planning bewerken" verbergen; tabs "Notities", "Serienummers", "Producten (read-only)" en "Documentatie" prominent.

**Stap 6 — Mobiel werkscherm uitbreiden**
- Toevoegen aan `InstallatieMonteurView`: 
  - **Foto/notitie-upload** (compact) per installatie, geschreven naar `installatie_notities` met `intern=true`.
  - **Storingsticket-knop** die naar `/helpdesk/tickets/nieuw?bron=installatie&installatie_id=...` navigeert.
  - **Tijdregistratie**: zichtbare timer tussen "starten" en "gereed melden" (lokaal + persisteert via `start_tijd/eind_tijd` velden).
  - **Retry**-mechanisme bij gereedmelding (mutation met automatische herhaling bij netwerkfout, toast met "later opnieuw proberen").
- Knop "Opleverrapport maken" altijd zichtbaar zodra status ≥ `in_uitvoering`.

**Stap 7 — Kleine UI-correcties**
- Dashboard-titel installateur → "Mijn werk".
- Nieuwe sidebar-link "Vandaag" voor installateur naar `/installaties?focus=vandaag`.

### Bestanden die geraakt worden
- `src/pages/Dashboard.tsx` — installateur-blok uitbreiden
- `src/pages/Installaties.tsx` — rol-gefilterde tabs + sortering
- `src/pages/Opdrachten.tsx` — verberg admin-acties voor installateur
- `src/pages/OpdrachtDetail.tsx` — actiebalk role-gaten
- `src/pages/InstallatieDetail.tsx` — tabs role-gaten
- `src/pages/InstallatieMonteurView.tsx` — foto/notitie upload, ticket-knop, timer, retry
- `src/pages/Planning.tsx` — installateur-perspectief in `mijnAgenda` + filter
- `src/components/AppSidebar.tsx` — kleine label-aanpassingen
- 1 SQL-migratie: `opdrachten.UPDATE` policy voor installateur op eigen opdracht (statusvelden)

### Niet-doelen
- Geen wijziging aan factuur/pakbon/financiële RLS — terecht admin-only.
- Geen offline-first PWA herinrichting — alleen lichte retry op gereedmelding.
- Geen wijziging aan opleverrapport-wizard zelf (al toegankelijk voor installateur).

