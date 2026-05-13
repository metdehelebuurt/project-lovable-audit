
## Inventarisatie e-mailtemplates

Het project gebruikt drie sporen voor uitgaande e-mail. Ze leven naast elkaar en vallen niet allemaal onder dezelfde "templates registry".

### 1. Transactional registry (`send-transactional-email`)
Deze worden centraal gerendered via React Email. Op dit moment slechts **2 templates**:
- `trial-welkom` — verstuurd na trial signup
- `nieuwe-lead` — verstuurd naar partner bij webformulier-lead

### 2. Dedicated send-functies (eigen rendering, niet via registry)
- `send-offerte-email` — offerte naar klant
- `send-factuur-email` — factuur naar klant
- `send-orderbevestiging-email` — orderbevestiging naar klant
- `oplever-verzend-klant` — opleverrapport / handtekening-verzoek naar klant
- `keuringen-cron` — herinnering volgende keuring
- `helpdesk-notify` — ticket-notificaties (nieuw/toewijzing/escalatie/oplossing/storing)
- `inkoop-verzend-leverancier` — inkooporder naar leverancier

### 3. Auth-mails (`auth-email-hook`, eigen template-folder)
Compleet: `signup`, `magic-link`, `recovery`, `invite`, `email-change`, `reauthentication`.

---

## Wat ontbreekt — partner krijgt nu géén e-mail terwijl het wel logisch is

Veel events maken alleen een in-app notificatie aan (via DB-triggers `notify_on_status_change`, `notify_service_bezoek`, `notify_ticket_*`, `notify_factuur_betaald`) maar versturen geen mail. Voor een partner die niet de hele dag in het portaal zit zijn dit de duidelijkste gaten.

### A. Sales / commercieel (hoogste prioriteit)
1. **Offerte geaccepteerd** door klant → partner (en adviseur)
2. **Offerte afgewezen** door klant → partner (incl. reden)
3. **Nieuw bericht op offerte-portal** (klant reageert in chat) → partner
4. **Offerte verloopt binnenkort** (geldig_tot − 3 dagen, status verzonden)
5. **Lead-status change naar 'gewonnen' of 'verloren'** → adviseur/owner

### B. Operatie (schouw, installatie, oplever)
6. **Schouw afgerond / rapport beschikbaar** → backoffice
7. **Schouw geannuleerd door klant**
8. **Installatie ingepland** (bevestiging naar partner + naar klant)
9. **Installatie gereed gemeld** door monteur → backoffice
10. **Opleverrapport ondertekend door klant** → backoffice/partner_admin
11. **Service-bezoek ingepland** → monteur (nu alleen in-app via `notify_service_bezoek`)

### C. Financieel
12. **Factuur betaald** → partner (trigger `notify_factuur_betaald` is alleen in-app)
13. **Factuur vervalt over X dagen** (herinnering naar partner)
14. **Factuur is vervallen / openstaand** → partner én klant (dunning)
15. **Inkoopfactuur match-discrepantie** → backoffice (nu alleen in `inkoop_factuur_match`)
16. **Voorschot/termijn vervalt** (vanuit `factuur_termijnen`)

### D. Abonnement & trial (`subscription-notifications`)
Maakt nu enkel in-app meldingen aan. Mail-templates ontbreken volledig:
17. **Trial verloopt over 7 dagen**
18. **Trial verloopt over 3 dagen**
19. **Trial verloopt morgen**
20. **Trial verlopen / abonnement gepauzeerd**
21. **Abonnement succesvol verlengd / betaling ontvangen** (Mollie webhook)
22. **Mislukte SEPA / mandaat ingetrokken** (Mollie)
23. **Add-on geactiveerd / opgezegd**

### E. Helpdesk / service
`helpdesk-notify` rendert nu inline HTML via `sendPartnerEmail`. Voor consistentie en branding zouden deze templates in de registry moeten:
24. **Nieuw ticket** binnengekomen
25. **Ticket toegewezen** aan medewerker
26. **Klantreactie** op ticket
27. **Ticket geëscaleerd** (SLA overschreden)
28. **Storingsmelding** (urgent)
29. **Ticket opgelost / gesloten** → klant + interne stakeholder

### F. Gebruikersbeheer
30. **Welkomstmail nieuwe medewerker** (uitgenodigd via `user-management`) — bevat wachtwoord-setup link
31. **Rol gewijzigd / toegang ingetrokken**
32. **Break-glass superadmin toegang verleend** → partner_admin (audit-notificatie)

### G. Affiliate / wederverkoper
33. **Nieuwe conversie geregistreerd**
34. **Maandelijkse uitbetaling onderweg**

### H. Webtools / integraties
35. **Nieuwe lead via batterij-selector / energieadvies** (apart van het generieke widget) — eventueel kan `nieuwe-lead` hergebruikt worden met varianten
36. **Partner-API token bijna verlopen / API-foutpiek** (security)

---

## Voorstel aanpak

Twee stappen:

**Stap 1 — Quick wins (commercieel + financieel + trial)**
Toevoegen aan de registry: items **1, 2, 3, 4, 12, 13, 14, 17, 18, 19, 21**.
Plus migratie van bestaande in-app triggers (`notify_factuur_betaald`, `subscription-notifications`) zodat ze óók `send-transactional-email` aanroepen — niet alleen een notificatie aanmaken.

**Stap 2 — Operatie + helpdesk + gebruikersbeheer**
Items **6, 8, 9, 10, 24–29, 30**. Voor helpdesk: huidige `helpdesk-notify` herschrijven zodat het de registry gebruikt i.p.v. inline HTML in `sendPartnerEmail`.

**Architectuur-keuzes die ik nodig heb voordat ik bouw:**
- Of we de bestaande `sendPartnerEmail`-route ook willen migreren naar de transactional registry (consistentie, één plek voor branding) of laten staan (heeft eigen routing per partner).
- Of de mailadressen voor partner-notificaties uit `helpdesk_notificatie_config.ontvangers` komen (zoals nu), uit `users` met rol `partner_admin`/`backoffice`, of een nieuwe tabel `notificatie_voorkeuren_partner` (per event-type aan/uit + ontvangers).
- Welke van bovenstaande lijst werkelijke prioriteit heeft — de lijst is bewust ruim, jij bepaalt de scope.

### Technische details
- Templates komen in `supabase/functions/_shared/transactional-email-templates/<naam>.tsx` met `export const template satisfies TemplateEntry`.
- Iedere nieuwe template wordt geregistreerd in `registry.ts`.
- Triggers worden ofwel toegevoegd in bestaande Edge Functions (`offerte-accept`, `offerte-reject`, `offerte-portal-messages`, `mollie-webhook`, `subscription-notifications`, `oplever-klant-ondertekenen`) ofwel in client-callsites (`OfferteEmailEditor`, `KlantBevestigingDialog`, `OrderbevestigingEmailDialog`).
- Branding (logo + primaire kleur per partner) moet doorgegeven worden via `templateData` zodat ook white-label partners herkenbaar mailen.
- Idempotency-keys per event-id + templateName, conform het transactional contract.

Geef aan welke groepen (A/B/C/D/E/F/G/H) ik mag aanpakken — of zeg "alles, stap 1 eerst" — dan zet ik het in een implementatieplan.
