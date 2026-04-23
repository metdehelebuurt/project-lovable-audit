

## Plan — Edge function errors bij aanmaken en verwijderen van gebruikers oplossen

### Root cause

**1. Verwijderen faalt structureel**
Auth-log toont:  
`update or delete on table "users" violates foreign key constraint "schouwen_adviseur_id_fkey"`.  
41 foreign keys verwijzen naar `public.users`. Veel staan op `NO ACTION` (ON DELETE blokkeert). Zodra de gebruiker ergens als `adviseur_id`, `installateur_id`, `toegewezen_aan`, `created_by`, etc. is gekoppeld, faalt de delete. De edge function vangt de error niet inhoudelijk af en geeft een generieke 500.

**2. Aanmaken faalt voor sommige rollen**
De UI biedt `consument` aan in de rol-dropdown, maar de edge function `user-management` heeft `consument` NIET in `allowedRolesForSuperadmin`. Resultaat: 400 "Ongeldige rol". Hetzelfde geldt voor `affiliate` als partner_admin de creatie doet.

### Oplossing

**A. Database-migratie — FK's omzetten naar SET NULL**
Eén migratie die voor alle FK's die naar `public.users` verwijzen en op `NO ACTION` staan, de `ON DELETE` regel wijzigt naar `SET NULL` (voor nullable kolommen) of `CASCADE` waar het record zonder de user betekenisloos is. Concreet:

| Tabel.kolom | Nieuwe regel | Reden |
|---|---|---|
| `schouwen.adviseur_id`, `schouwen.installateur_id` | SET NULL | historie behouden |
| `offertes.adviseur_id` | SET NULL | offertes blijven bestaan |
| `installaties.installateur_id`, `installaties.created_by`, `installaties.consument_id` | SET NULL | installatie blijft bestaan |
| `opdrachten.toegewezen_monteur_id` | SET NULL | |
| `leads.toegewezen_aan`, `leads.owner_user_id` | SET NULL | |
| `afspraken.adviseur_id` | SET NULL | |
| `lead_contactmomenten.user_id`, `lead_notities.user_id` | SET NULL | |
| `documenten.geupload_door_id`, `documenten.consument_id` | SET NULL | |
| `consumenten.user_id` | SET NULL | |
| `tickets.consument_id` | SET NULL | |
| `installatie_historie.actor_id`, `installatie_notities.auteur_id` | SET NULL | |
| `opleverrapporten.created_by` | SET NULL | |
| `affiliate_commissies.affiliate_id` | SET NULL | |
| `inkoop_ontvangsten.ontvangen_door` (al SET NULL) | ongewijzigd | |
| Tabellen die al `CASCADE`/`SET NULL` zijn | ongewijzigd | |

Voor kolommen die `NOT NULL` zijn maar wel een user vereisen wordt `CASCADE` gebruikt; dat zijn typisch persoonlijke records (notificaties, affiliate_links, feedback_verzoeken — die staan al op CASCADE).

**B. Edge function `user-management` robuuster maken**

- `create_user`: voeg `consument` en `affiliate` toe aan `allowedRolesForSuperadmin`. Sta `affiliate` ook toe voor `partner_admin` (huidige lijst uitbreiden).
- `delete_user`: leg uit waarom het mislukt als er nog FK's klemzitten — vang Postgres-fout met code `23503` af en retourneer `400` met heldere boodschap "Gebruiker is nog gekoppeld aan X records. Wijs eerst over of archiveer.". Zo krijgt de gebruiker direct een leesbare melding i.p.v. een generieke 500.
- Volgorde delete: eerst `auth.admin.deleteUser` proberen — als FK's naar `public.users` bestaan en op CASCADE staan ruimt Supabase mee op. Anders eerst `public.users` delete (na migratie werkt dit altijd).

**C. UI consistentie**
- In `Gebruikers.tsx`: de aanmaak-dropdown matcht nu wel met de toegestane rollen in de edge function.

### Impact
- Bestaande records met user-FK's krijgen `NULL` op die kolom als de user wordt verwijderd; historie blijft intact.
- Geen schade aan data; geen RLS-wijzigingen.

### Bestanden
- `supabase/migrations/<timestamp>_fk_users_set_null.sql` — alle ALTER TABLE / DROP CONSTRAINT / ADD CONSTRAINT statements.
- `supabase/functions/user-management/index.ts` — rol-allowlists uitbreiden + 23503-foutafhandeling bij delete.
- `src/pages/Gebruikers.tsx` — eventueel kleine validatie-melding toevoegen (optioneel).

### Niet-doelen
- Geen herinrichting van rollen of permissies.
- Geen wijziging aan RLS-policies.
- Geen aanpak van consument-koppeling aan klant via e-mail (apart memory-onderwerp).

