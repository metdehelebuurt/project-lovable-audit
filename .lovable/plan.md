
# Mail-architectuur opschonen + verzendlogs voor platformadmin

## Het verschil dat we vasthouden (3 stromen, blijven gescheiden)

```text
1) PARTNER → externen (offerte, factuur, orderbevestiging, oplever, helpdesk-notify)
   Afzender: het Gmail/Outlook-account van de partner (email_accounts).
   Logging:  email_log + email_berichten (in de Inbox van de partner).
   Code:     _shared/partner-email-send.ts  → ONGEWIJZIGD.

2) GEBRUIKER → externen (1-op-1 vanuit eigen postvak, b.v. inkoop, ad-hoc mails)
   Afzender: persoonlijke OAuth-mailbox van de ingelogde user.
   Logging:  email_log + email_berichten (zichtbaar in eigen Inbox).
   Code:     _shared/user-email-send.ts     → ONGEWIJZIGD.

3) PLATFORM → eindgebruiker (auth-mails + systeem/transactional mails van Mijnhuis zelf)
   Afzender: notify.mijnhuis.nu via Lovable Email.
   Logging:  email_send_log (al aanwezig) — apart van partner/user-logs.
   Hier zit nu de gap: deels niet ingericht, geen UI om logs te zien.
```

Stroom 1 en 2 raken we niet aan. Alle nieuwe werk zit in stroom 3 + één
nieuw platformadmin-scherm dat álle drie de stromen kan tonen, mét duidelijk
label wie welke mail verstuurde.

## Wat we gaan bouwen

### A. Lovable Email infrastructuur afmaken (stroom 3)

DNS-domein `notify.mijnhuis.nu` staat al op pending. We:

1. Roepen `email_domain--setup_email_infra` aan (idempotent — vult queues,
   RPC's, cron, vault-secret aan voor zover nog niet aanwezig).
2. Roepen `email_domain--scaffold_auth_email_templates` aan zodat
   wachtwoord-reset / magic-link / signup-bevestiging via onze eigen
   gebrande templates lopen i.p.v. de default Lovable mail. Templates in
   Mijnhuis-stijl (paars primary, Nederlands).
3. Roepen `email_domain--scaffold_transactional_email` aan voor
   `send-transactional-email` + unsubscribe + suppression.
4. Voegen één template toe: `trial-welkom` (welkomstmail nieuwe trial-partner)
   en hangen die aan `trial-signup`. Verdere triggers worden later toegevoegd
   wanneer nodig — geen scope-creep.

### B. Verzendlogs-dashboard voor superadmin

Nieuw menu-item onder **Superadmin → E-maillogs** (route
`/superadmin/email-logs`, beschermd via `ProtectedRoute allowedRoles={["superadmin"]}`).

Drie tabs:

```text
[ Platform-mails ]   bron: email_send_log (Lovable Email)
[ Partner-mails  ]   bron: email_log waar verzonden_door_id = user van partner
[ Gebruiker-inbox]   bron: email_berichten (samenvatting per partner)
```

Per tab:

- Tijdsfilter (24u / 7d / 30d / custom)
- Templatenaam / type filter (dropdown uit data)
- Statusfilter (verzonden / mislukt / suppressed / dlq)
- Stat-cards: totaal, verzonden, mislukt, suppressed
- Tabel met paginatie (50/pagina, sort op datum desc)
- Detail-drawer: html-preview, foutmelding, headers, ontvanger

**Belangrijk voor stroom 3:** dedupliceren op `message_id` (DISTINCT ON)
zodat één mail niet dubbel telt.

**Voor stroom 1+2 in de tabel een kolom "Verzonden door":**
- Naam van de gebruiker (`users.naam`) + e-mailadres dat in `from` zat
- Provider-badge: `Partner SMTP`, `Gmail (gebruiker)`, `Outlook (gebruiker)`,
  `Lovable Email (platform)` — afgeleid van bron + `email_log.type`.

Hierdoor zie je in één oogopslag: "deze mail kwam vanuit Roshny haar
Gmail-postvak", "die kwam vanuit Mijnhuis-platform", "die kwam vanuit
partner-SMTP".

### C. helpdesk-notify migreren naar shared sender

Nu heeft `helpdesk-notify` 130+ regels gedupliceerde Gmail/Graph code. We
vervangen dat door een aanroep van `sendPartnerEmail()`, zodat:

- minder code (regel-limiet),
- consistent gedrag (token refresh, foutlogging),
- alle partner-uitgaande mails op één plek bij elkaar.

Stroom blijft hetzelfde (partner-account → ontvanger), alleen via shared
helper.

### D. Niet doen

- Geen nieuwe Edge Functions per mailtype (regel: 1 generieke
  `send-transactional-email`).
- Partner-flows (offerte/factuur/oplever/inkoop) niet aanraken.
- Auth-mails niet via partner-account — die horen platform te zijn (Lovable
  Email), zodat ze ook werken vóórdat een partner z'n Gmail koppelt.

## Bestanden / wijzigingen

```text
NIEUW:
  src/pages/Superadmin/EmailLogs/index.tsx
  src/pages/Superadmin/EmailLogs/PlatformTab.tsx
  src/pages/Superadmin/EmailLogs/PartnerTab.tsx
  src/pages/Superadmin/EmailLogs/InboxTab.tsx
  src/pages/Superadmin/EmailLogs/EmailDetailDrawer.tsx
  src/pages/Superadmin/EmailLogs/filters.tsx
  src/pages/Superadmin/EmailLogs/useEmailLogs.ts
  supabase/functions/_shared/transactional-email-templates/trial-welkom.tsx
  (auth email templates worden door scaffold tool aangemaakt)

GEWIJZIGD:
  src/App.tsx                 — route toevoegen
  src/lib/navigation/...      — menu-item Superadmin
  supabase/functions/helpdesk-notify/index.ts   — vervangen door sendPartnerEmail
  supabase/functions/trial-signup/index.ts      — invoke send-transactional-email

INFRA-tools:
  email_domain--setup_email_infra
  email_domain--scaffold_auth_email_templates
  email_domain--scaffold_transactional_email
  supabase--deploy_edge_functions [auth-email-hook, send-transactional-email,
                                   process-email-queue, helpdesk-notify, trial-signup]
```

## Wat de superadmin straks ziet

Eén dashboard, drie heldere kolommen "wie/waarvandaan/waarheen":

```text
| Datum | Type           | Verzonden door          | Aan              | Status   |
| ----- | -------------- | ----------------------- | ---------------- | -------- |
| 09:14 | offerte        | Roshny (Gmail)          | klant@x.nl       | ✅       |
| 09:11 | helpdesk_notify| Smartaccu (Gmail)       | esteban@cenora   | ✅       |
| 09:02 | wachtwoord-res | Platform (Lovable)      | charlotte@cen…   | ✅       |
| 08:58 | trial-welkom   | Platform (Lovable)      | nieuw@partner.nl | ⚠ dlq    |
```

DNS-vinkje voor `notify.mijnhuis.nu` is een randvoorwaarde — totdat dat
groen is werken auth/system-mails nog niet, maar de logs en partner-mails
werken direct na deze release.

## Open punt waar ik akkoord op vraag

De DNS-records voor `notify.mijnhuis.nu` staan op **Pending**. Als jij die
verificatie nog niet hebt afgerond (in **Cloud → Emails**), dan zal de
infra-stap wel slagen maar zullen platform-mails pas wegvliegen zodra DNS
groen is. Partner/gebruiker-mails en het log-dashboard werken direct.

Akkoord op deze aanpak? Dan zet ik 'm in elkaar in deze volgorde:
1. infra + auth-templates + transactional-scaffold
2. trial-welkom template + trial-signup koppeling
3. helpdesk-notify opruimen
4. Superadmin → E-maillogs dashboard
