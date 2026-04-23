

## Plan — Backoffice kan monteurs en collega's niet zien

### Root cause
1. **RLS op `public.users`**: de rol `backoffice` ontbreekt in alle SELECT-policies. Roshny ziet daardoor uitsluitend haar eigen rij. Gevolg: lege monteur-dropdown in het service-bezoek-dialog en lege "Toewijzen aan…"-lijst op het ticket.
2. **Frontend-filter**: in `TicketDetail` ontbreekt `backoffice` in de rol-filter van `partner-collegas`, en in `useMonteurs` ontbreekt `backoffice` ook (waardoor backoffice-collega's nooit als verantwoordelijke voor een bezoek kunnen worden gekozen).

### Wat we doen

**A. Database-migratie (RLS uitbreiden)**

Eén nieuwe migratie die de bestaande SELECT-policies op `public.users` herschrijft zodat `backoffice` óók partner-collega's kan lezen — exact dezelfde scope als `partner_admin` / `partner_staff` / `adviseur`:

- Bestaande policies "Partner admin ziet eigen partner users" en "Adviseur ziet partner teamleden" worden vervangen door één gecombineerde SELECT-policy die `partner_admin`, `partner_staff`, `adviseur` én `backoffice` toelaat — gescoped op de eigen `partner_id`.
- Eigen profiel + superadmin-policies blijven ongewijzigd.

Geen wijzigingen op INSERT/UPDATE/DELETE — backoffice mag alleen lezen, niet bewerken.

**B. Frontend-fix (twee plekken)**

1. `src/pages/helpdesk/TicketDetail/index.tsx`, regel 54:
   `.in("rol", ["partner_admin", "partner_staff", "adviseur", "installateur", "backoffice"])`
   Zodat backoffice-medewerkers tickets aan elkaar kunnen toewijzen.

2. `src/components/helpdesk/ServiceBezoekDialog.tsx`, regel 21:
   Monteur-rol-filter blijft `installateur` + `partner_staff` + `partner_admin` (correct — backoffice rijdt niet uit). Alleen verbreden naar óók `backoffice` in de TicketDetail-lijst is nodig.

### Bestanden

- Nieuwe migratie onder `supabase/migrations/` met de aangepaste SELECT-policies op `public.users`.
- `src/pages/helpdesk/TicketDetail/index.tsx` — rol-filter uitbreiden met `backoffice`.

### Verwacht resultaat

Roshny ziet direct na deploy:
- In de "Toewijzen aan…"-dropdown alle 6 collega's bij Smart Accu (adviseur, installateurs, partner_admin, en zichzelf).
- In het "Service-bezoek inplannen"-dialog de 3 installateurs + de partner_admin als monteur.

### Niet-doelen
- Geen wijzigingen aan INSERT/UPDATE/DELETE rechten van `backoffice` op users.
- Geen herontwerp van het service-bezoek-dialog of ticket-toewijzing — alleen de zichtbaarheid wordt gerepareerd.

