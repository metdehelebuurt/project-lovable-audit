

## Plan — Klantfeedback deel 1: ticketcommunicatie, monteurplanning, notificaties

Vijf samenhangende verbeteringen voor backoffice, monteurs en notificaties. Ik splits ze per onderwerp en geef per onderdeel scope, gedrag en impact.

---

### 1. Externe communicatie in tickets (fabrikant, leverancier, monteur)

**Wat er nu is**: `helpdesk_ticket_berichten.richting` kent alleen `intern`, `inkomend` en `uitgaand`. De backoffice kan dus geen onderscheid maken tussen klant, fabrikant, leverancier of monteur.

**Wat er komt**:
- Berichttype uitbreiden met categorieën: **klant, fabrikant, leverancier, monteur, intern**.
- Per bericht extra veld voor **contactpersoon-naam**, **contact-e-mail/telefoon** en **organisatie** (vrij invulveld), zodat de backoffice ziet "Mail naar Service-afdeling Enphase, Jan Pietersen, jan@enphase.com".
- Op de Communicatie-tab een **filtertabbalk**: Alle / Klant / Leverancier / Fabrikant / Monteur / Intern.
- Berichten krijgen een gekleurde badge per kanaal (klant=blauw, fabrikant=paars, leverancier=oranje, monteur=groen, intern=amber).
- Bij uitgaand naar fabrikant/leverancier kan optioneel direct een e-mail verstuurd worden (zelfde edge-function `email-api-send` die nu al wordt gebruikt voor klantmails).
- De velden voor contactgegevens worden onthouden per ticket → snelkeuze de tweede keer.

**Database**: één migratie die `helpdesk_ticket_berichten` uitbreidt met `kanaal_type` (text, default 'intern'), `extern_naam`, `extern_email`, `extern_organisatie`, `extern_telefoon`. De bestaande `richting` kolom blijft voor terugwaartse compatibiliteit.

---

### 2. Klantcontactgegevens direct zichtbaar in ticketheader

**Wat er nu is**: De klant staat onderaan in de "Koppelingen"-sectie als linkje. Naam en contact zijn niet direct in beeld.

**Wat er komt**:
- Nieuwe **klantcontact-strook** direct onder de ticketheader: naam (groot), telefoon (klikbaar `tel:`), e-mail (klikbaar `mailto:`), adres, postcode/plaats — twee regels, compact.
- Bron: `klanten` tabel via bestaande `ticket.klant_id`. Bij ontbrekende koppeling wordt de strook verborgen.
- Knoppen rechts in de strook: **Bel klant**, **Mail klant**, **Open klantkaart**.
- Werkt ook responsive (mobiel: stapel naam/contact onder elkaar).

**Geen DB-wijziging** nodig — alle data is al beschikbaar via `klanten`.

---

### 3. Monteurplanning uitbreiden voor backoffice

**Wat er nu is**: `helpdesk_service_bezoeken` koppelt monteur, datum, tijd. Geen schatting van duur. Geen regio-overzicht voor backoffice.

**Wat er komt**:

**A. Geschatte duur op tickets en service-bezoeken**
- Ticketformulier en bewerken: optioneel veld **Geschatte oplostijd** (in minuten, dropdown 15/30/60/90/120/180/240/heel dag).
- Service-bezoek-dialog krijgt zelfde veld, vooringevuld vanuit ticketschatting.
- Op planning getoond als blokduur.

**B. Backoffice planning-dashboard**
- Nieuwe sub-pagina `/helpdesk/planning` (alleen partner_admin/backoffice/partner_staff): **Open tickets per regio** + monteurplanning naast elkaar.
- Lijst van openstaande tickets met klantadres + postcode + geschatte duur, gegroepeerd per **eerste 2 cijfers van postcode** (regio).
- Per monteur diens dagplanning met huidige bezoeken en gaten ("tussen 10:30-12:00 vrij in regio 36xx").
- Klik op een open ticket → "Inplannen bij monteur X" knop met voorgevulde dialog.
- Filter op: datum (vandaag/morgen/deze week), regio, prioriteit.

**C. Postcode-regio op tickets**
- Wordt afgeleid uit gekoppelde klant; geen extra veld nodig.

**Database**: één migratie voegt `geschatte_duur_minuten` (integer, nullable) toe aan zowel `helpdesk_tickets` als `helpdesk_service_bezoeken`.

---

### 4. Monteur kan ticket aanmaken vanuit installatie — zonder klantmail

**Wat er nu is**:
- Vanuit installatie kan al een ticket worden aangemaakt (knop bestaat in `InstallatieHeader`).
- Installateur kan in de Communicatie-tab op richting "uitgaand" zetten en e-mail naar klant sturen — dat moet **geblokkeerd** worden.
- Geen verplichte koppeling tussen installatie en eigenaar in backoffice.
- Geen automatische notificatie naar de installatie-eigenaar.

**Wat er komt**:

**A. Velddoel: "managed door"**
- `installaties.created_by` is er al, maar wordt niet altijd gevuld en niet getoond. We voegen een expliciet veld **`backoffice_eigenaar_id`** toe (nullable, fk → users) — wie de installatie beheert vanuit kantoor. Bij aanmaak default = `created_by`. Wijzigbaar door beheerders.
- Op installatiedetail-header en in de planning/lijst tonen we **"Beheerd door: [naam]"**.

**B. Installateur-restricties op communicatie**
- In `CommunicatieTab`: als de huidige gebruiker rol `installateur` heeft, is de richting-dropdown beperkt tot **alleen "intern" en "monteur"**. Optie "naar klant" verdwijnt voor hen.
- Server-side trigger op `helpdesk_ticket_berichten`: weiger insert van `richting='uitgaand'` of `kanaal_type='klant'` als auteur installateur is.

**C. Notificatie naar backoffice-eigenaar**
- Als een installateur een ticket aanmaakt vanuit een installatie, krijgt de `backoffice_eigenaar_id` (of fallback `created_by`) een notificatie + transactionele e-mail via `helpdesk-notify` edge function (bestaat al, breiden we uit met dit scenario).

**Database**: migratie voegt `backoffice_eigenaar_id` toe aan `installaties` + RLS update. Plus trigger op `helpdesk_ticket_berichten` voor de installateur-restrictie.

---

### 5. Notificatiemodule uitbreiden + rode telbolletjes in sidebar

**Wat er nu is**:
- `notificaties` tabel + `NotificatieCenter` widget in header werkt voor leads/offertes/installaties/schouwen/opdrachten via DB-triggers.
- Géén status-trigger op `helpdesk_tickets`, `helpdesk_ticket_berichten`, `helpdesk_service_bezoeken`, `financiele_documenten`.
- Sidebar heeft géén indicator per module — gebruikers zien niet waar nieuwe input is.

**Wat er komt**:

**A. Triggers uitbreiden**
- Nieuwe DB-triggers die `notificaties` rij maken bij:
  - **Nieuwe ticket toegewezen** aan jou
  - **Nieuw bericht (richting=inkomend)** op jouw ticket
  - **Service-bezoek ingepland** voor jou als monteur
  - **Ticket geëscaleerd** (SLA overschreden) → notificatie naar `toegewezen_aan` + `backoffice_eigenaar` van gekoppelde installatie
  - **Nieuwe verkoopfactuur betaald** → notificatie naar `created_by`
  - **Nieuwe inkomende e-mail** gekoppeld aan klant → naar betreffende adviseur

**B. Per-module ongelezen-tellers in sidebar**
- Nieuwe hook `useModuleNotificatieCounts` haalt aantallen ongelezen items per module (leads, offertes, installaties, tickets, berichten, financieel) — gegroepeerd op `entity_type`.
- `SidebarNavItem` krijgt prop `badgeCount`. Indien > 0: rood bolletje rechts naast titel met getal (max "9+").
- Tellers updaten realtime via bestaande `notificaties-realtime` channel.
- Klikken op de module markeert de bijbehorende notificaties als gelezen (per `entity_type`).

**C. Notificatiecenter verbetert**
- Filtertabs: Alle / Tickets / Installaties / Leads / Financieel.
- Klikken op notificatie navigeert direct naar de bron (`entity_type` + `entity_id` → juiste route).
- Toevoegen van **"Mijn voorkeuren"** knop → naar nieuwe pagina `/instellingen/notificaties` waar gebruiker per type kan aan/uit zetten (e-mail én in-app).

**Database**: één migratie met de extra triggers en een nieuwe tabel `notificatie_voorkeuren` (user_id, type, in_app boolean, email boolean).

---

### Bestanden

**Database (3 migraties)**
- berichten-uitbreiding + ticket/service duur
- installatie eigenaar-veld + bericht-restrictie trigger
- notificatie-triggers + voorkeurentabel

**Frontend**
- `src/pages/helpdesk/TicketDetail/CommunicatieTab.tsx` — kanalen, filters, externe contactvelden, installateur-restrictie
- `src/pages/helpdesk/TicketDetail/index.tsx` — klantcontact-strook
- `src/pages/helpdesk/TicketNieuw.tsx` + `useTickets.ts` — geschatte duur
- `src/pages/helpdesk/Planning.tsx` (nieuw) + route + sidebar-link
- `src/components/helpdesk/ServiceBezoekDialog.tsx` — duurveld
- `src/components/installaties/InstallatieHeader.tsx` + `InstallatieDetail.tsx` — eigenaar zichtbaar + selecteerbaar
- `src/components/AppSidebar.tsx` — badgeCount in items
- `src/components/NotificatieCenter.tsx` — filters, klikbare navigatie
- `src/hooks/useModuleNotificatieCounts.ts` (nieuw)
- `src/pages/instellingen/NotificatieVoorkeuren.tsx` (nieuw) + tab in Instellingen

**Edge function**
- `supabase/functions/helpdesk-notify/index.ts` — extra event "monteur_ticket_naar_eigenaar"

### Niet-doelen
- Geen wijziging aan klant/lead-detailschermen.
- Geen marketing-mailings.
- Geen mobile-app voor monteurs (loopt al via mobiel werkscherm).
- Geen complete CRM-routing engine — postcode-groepering is op 2 cijfers, geen geocoding.

