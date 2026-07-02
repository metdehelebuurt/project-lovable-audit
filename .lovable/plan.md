
# Affiliate dashboard: notificaties + sales-boosters

Doel: de affiliate ziet in één oogopslag waar actie nodig is, mist geen enkel signaal van een lead/klant, en krijgt slimme nudges die conversie verhogen.

## 1. Ongelezen-badges op lead- en klantkaarten

Op elke `LeadKaart` (Kanban + lijst) en `KlantKaart` (Mijn klanten) een badge tonen zodra er iets nieuws is dat de affiliate nog niet gezien heeft:

- Nieuwe **inbound email** (`email_berichten` waar `richting='in'` en `gelezen_op is null`).
- Nieuwe **portal-opmerking / bericht** van de consument (`offerte_berichten`, ticket-reacties).
- Nieuwe **AI-opvolgtaak** of terugbelafspraak die vandaag speelt.
- **Statuswijziging** door platform/sales admin sinds laatste bezoek.

Implementatie: één RPC `affiliate_lead_signals(user_id)` die per lead een count teruggeeft van ongelezen items (per type). De counts worden gejoined in `useAffiliateLeads` en `useMijnKlanten`. Kaart toont een gekleurde dot + tooltip ("2 nieuwe e-mails, 1 opmerking"). Openen van de lead-detail markeert automatisch als gezien via `laatst_bekeken_op` op `affiliate_leads`.

## 2. Realtime toast + globale bell

- Nieuwe `<AffiliateNotificatieBell />` in de affiliate-topbar, met dropdown (laatste 20, ongelezen count, "alles gelezen").
- Realtime channel op `notificaties` (waar `user_id = auth.uid()`) → toast + bell-update + optioneel browser-notification (bestaande `useBrowserNotifications`).
- Nieuwe triggers/edge-hooks die records in `notificaties` schrijven voor de affiliate-eigenaar bij:
  - inbound email op een van zijn leads/klanten
  - nieuwe portal-opmerking op offerte/ticket
  - lead uit pool toegewezen aan hem
  - hot-lead-signaal (zie 4)
  - terugbelafspraak over < 15 min
  - trial die over 3 / 1 dagen verloopt
  - offerte verstuurd > 5 dagen geleden zonder reactie
  - lead > X dagen stil (SLA-overschrijding pipeline-fase)

## 3. "Vandaag" widget uitgebreid voor affiliate

Op `AffiliateDashboard` een compacte "Wat moet ik nu doen"-kaart die de volgende taken combineert en sorteert op urgentie:

1. Terugbelafspraken vandaag (met 1-klik "bel nu" + "verzet 1u").
2. Openstaande AI-opvolgtaken.
3. Leads met verlopen SLA (kleur = agingNiveau).
4. Ongelezen inbound e-mails.
5. Trials die deze week verlopen.

Elk item is een rij met snelle acties (bellen, mailen, snooze, markeer klaar).

## 4. Slimme conversieboosters

- **Hot-lead-detector**: nachtelijke edge-cron die op basis van leadScore, recente website-activiteit en emailopens/klikken (via `email_send_log`) leads promoveert naar temperatuur "heet" en een notificatie stuurt.
- **Best time to call**: op basis van `affiliate_lead_contactmomenten` per lead een suggestie ("bereikt meestal na 17:00") tonen in de LeadDetail Hero.
- **Silent-lead reactivator**: leads > 14 dagen zonder activiteit → automatisch een suggestie voor een sjabloonmail ("Nog interesse?") in de opvolgingskaart.
- **Snelle e-mail-sjablonen** ("Kennismaking", "Offerte follow-up", "Laatste kans") direct als knop op de leadkaart hover-menu; opent `EmailCompose` met snippet + tracking.
- **Deal-waarschijnlijkheid**: bestaande leadScore uitbreiden met win-rate per fase en per bron; tonen als % op de kaart.
- **Bulk-nudge**: in Kanban een filter "stil > 7 dagen" met bulk-actie "Stuur reactivatiemail".

## 5. Meldingen bij samenwerking

- Wanneer een collega/sales-admin een **notitie of contactmoment** logt op een van jouw leads → notificatie + rood dotje op de kaart.
- **@mentions** in notities (bestaande `processMentions`) uitbreiden zodat ze een affiliate-notificatie triggeren.
- **"Lead overgenomen" waarschuwing** als admin een lead herwijst.

## 6. Notificatie-voorkeuren

Uitbreiding van `notificatie_voorkeuren` met affiliate-specifieke kanalen (email/toast/browser/geen) per categorie: inbound-mail, portal-opmerking, hot-lead, SLA-overschrijding, trial-verloop, terugbel-reminder. Instelpagina onder Affiliate → Instellingen → Notificaties.

## 7. UI-details

- Kaart-badge: kleine cirkel linksboven, kleur per type (blauw=mail, paars=opmerking, rood=SLA, oranje=terugbel).
- Bell dropdown groepeert per lead ("Acme BV — 2 nieuwe e-mails, 1 opmerking").
- Toast is klikbaar → navigeert direct naar juiste tab van de leaddetail (`?tab=email` / `?tab=opvolging`).
- Alle nieuwe UI in Nederlands, purple primary, geen emoji's.

## Technische samenvatting

**Nieuwe DB-objecten**
- Kolom `affiliate_leads.laatst_bekeken_op timestamptz`.
- Kolom `email_berichten.gelezen_op timestamptz` (indien nog niet aanwezig).
- RPC `affiliate_lead_signals(_user_id uuid)` → `(lead_id, ongelezen_mails, ongelezen_opmerkingen, openstaande_taken, sla_status)`.
- Triggers op `email_berichten`, `offerte_berichten`, `affiliate_terugbel_afspraken`, `affiliate_leads` (status/eigenaar-wijziging) → `INSERT INTO notificaties`.
- Edge cron `affiliate-signals-cron` (elke 15 min): hot-lead-detectie, SLA-checks, trial-verloop, stille-lead-reactivator.

**Nieuwe/aangepaste frontend-bestanden**
- `src/components/affiliate/AffiliateNotificatieBell.tsx`
- `src/hooks/affiliate/useAffiliateNotificaties.ts` (realtime + list + mark-read)
- `src/hooks/affiliate/useLeadSignals.ts` (join in useAffiliateLeads)
- `src/components/affiliate/LeadKaart.tsx` en `KlantKaart.tsx`: signal-badges + hover snelle acties
- `src/pages/affiliate/AffiliateDashboard.tsx`: "Wat moet ik nu doen"-widget
- `src/components/affiliate/LeadDetail/Hero.tsx`: best-time-to-call + hot-lead-indicator
- `src/pages/affiliate/instellingen/Notificaties.tsx`: voorkeuren
- Uitbreiding `processMentions` → notificatie insert

**Fasering (aanbevolen)**
1. Basis: signals-RPC + kaart-badges + `laatst_bekeken_op` markering.
2. Bell + realtime toasts + triggers voor mail/opmerking/terugbel.
3. "Vandaag"-widget op affiliate dashboard.
4. Hot-lead + SLA + trial cron.
5. Snelle e-mailsjablonen, bulk-nudge, best-time-to-call.
6. Voorkeurenpagina.

Laat me weten welke fasering je wil en of we alles in één keer bouwen of stap 1 eerst.
