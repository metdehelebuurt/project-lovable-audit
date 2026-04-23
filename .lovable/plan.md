

## Plan — Backoffice-rol kan klanten, schouwen, opdrachten en meer niet zien

### Root cause

Roshny (`roshny@smartaccu.nl`) heeft de juiste rol (`backoffice`) bij partner Smart Accu. Er zijn ook gewoon records in de database (5 klanten, 4 installaties, 18 offertes, 15 leads, 9 schouwen, 4 opdrachten).

Het probleem zit in de **RLS-policies**. Toen de rol `backoffice` is toegevoegd, zijn slechts een paar tabellen aangepast (`leads`, `offertes`, `installaties`). Op **15 andere tabellen** staat alleen "Partner users zien eigen partner X" met de allowlist `['partner_admin', 'partner_staff']` — `backoffice` ontbreekt daar volledig. Resultaat: zodra Roshny een module opent die op zo'n tabel rust, krijgt ze 0 rijen terug ondanks dat de data er wel is.

### Tabellen zonder backoffice-SELECT-policy

- `klanten` → klantenoverzicht leeg
- `schouwen` → schouwen leeg
- `opdrachten` → opdrachten leeg
- `afspraken` → planning mist afspraken
- `consumenten`, `documenten`
- `helpdesk_tickets`, `helpdesk_service_bezoeken`, `helpdesk_kennis_artikelen`, `tickets`
- `leveranciers`
- `installateur_voorkeuren`
- `users` (gebruikers-overzicht onvolledig)
- `web_widgets`
- `audit_log` (auditlog onzichtbaar voor backoffice)

Daarnaast moet ook gecontroleerd worden of `backoffice` mag muteren (INSERT/UPDATE/DELETE) op de tabellen die ze functioneel nodig heeft — dat lopen we per tabel kort na in dezelfde migratie.

### Oplossing

**Eén database-migratie** die voor elk van bovenstaande tabellen consistent de bestaande "partner users zien eigen partner X" SELECT-policy uitbreidt door `backoffice` toe te voegen aan de rol-allowlist. Daarmee gaat het patroon overal naar:

```
get_user_role(auth.uid()) = ANY (ARRAY['partner_admin','partner_staff','backoffice']::app_role[])
AND partner_id = get_user_partner_id(auth.uid())
```

Voor mutaties (INSERT/UPDATE/DELETE) doen we hetzelfde waar de bestaande policy ook `partner_admin/partner_staff` toelaat:
- `klanten`, `schouwen`, `opdrachten`, `afspraken`, `documenten`, `notities`, `leveranciers`, `helpdesk_tickets`, `helpdesk_service_bezoeken`, `helpdesk_kennis_artikelen`, `consumenten`, `web_widgets` → backoffice toegevoegd voor INSERT/UPDATE/DELETE.
- `users`, `audit_log`, `installateur_voorkeuren` → alleen SELECT toevoegen (admin/beheer-handelingen blijven bij `partner_admin`).

### Niet-doelen

- Geen wijziging aan rol-definitie of `permissions.ts` (front-end allowlists kloppen al).
- Geen aanpassing van superadmin/adviseur/installateur policies.
- Geen wijziging aan ProtectedRoute / module-cascade.
- Geen aanpak van eventueel ontbrekende module-toegang in `module_rol_toegang` (die zou per partner kunnen verschillen — als na de fix nog modules dichtzitten, kijken we daar in een vervolgactie naar).

### Bestanden

- Eén nieuwe SQL-migratie onder `supabase/migrations/` die alle bovengenoemde policies herschrijft.

### Verwacht resultaat

Na de migratie ziet Roshny direct alle klanten, schouwen, opdrachten, afspraken, tickets, leveranciers, gebruikers, documenten en widgets van Smart Accu. Bestaande data blijft ongewijzigd; alleen toegang wordt verbreed binnen haar eigen partner-scope.

