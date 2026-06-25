## Doel

Een gebruiker met een bestaande rol (bv. `partner_admin` voor esteban@cenora.nl) kan affiliate-functionaliteit erbij krijgen **zonder** dat zijn primaire rol, partnerkoppeling, navigatie of data verandert. De affiliate-modules verschijnen er **bovenop**.

Sales-manager (`bas@mijnhuis.nu`) blijft het affiliate-gedeelte van zo'n hybride gebruiker zien (bestaande `sales_admin_*` policies blijven werken).

## Aanpak: additieve rollen via `user_roles`

Vandaag staat de rol als enkel veld op `public.users.rol`. Promoveren overschrijft die rol en zet `partner_id = NULL` — dat is precies wat we willen vermijden. We introduceren een aparte tabel voor **extra** rollen naast de primaire rol.

### 1. Database

Nieuwe migratie:

- `CREATE TABLE public.user_roles (user_id uuid → auth.users, rol app_role, ...)` met unique `(user_id, rol)`.
- GRANTs + RLS: alleen de gebruiker zelf + superadmin/partner_admin van zelfde partner mogen lezen, alleen superadmin mag schrijven.
- Security-definer functies:
  - `public.user_has_role(_uid uuid, _rol app_role) returns boolean` → true als `users.rol = _rol` óf rij in `user_roles`.
  - `public.get_user_roles(_uid uuid) returns app_role[]` → primair + secundair, voor frontend.
- Backfill: niks (lege tabel; bestaande affiliates blijven via `users.rol`).

### 2. RLS-aanpassingen (alleen affiliate-tabellen)

Op tabellen die nu `get_user_role(uid) = 'affiliate'` of `users.rol = 'affiliate'` checken, vervangen door `user_has_role(uid, 'affiliate')`. Scope: 

- `affiliate_links`, `affiliate_leads`, `affiliate_lead_contactmomenten`, `affiliate_terugbel_afspraken`, `affiliate_opvolg_*`, `affiliate_instellingen`, `affiliate_email_templates`, `affiliate_targets`, `affiliate_referrals`, `affiliate_commissies`, `affiliate_onboarding_taken`, `affiliate_lead_imports`, `affiliate_opvolg_log`, `lead_duplicaat_negeerlijst_affiliate`.

Alle andere policies (partners, klanten, leads, offertes, …) **niet aanraken** — die blijven op `users.rol` zodat de partner-admin-rechten 100% intact blijven.

### 3. Edge function `user-management`

Twee nieuwe acties, oude blijven werken voor pure affiliates:

- `add_affiliate_role`: insert in `user_roles (user_id, 'affiliate')`, seed default `affiliate_links` rij (skip als er al een actief is), audit-log, **raakt `users.rol`/`partner_id` niet aan**.
- `remove_affiliate_role`: delete uit `user_roles`, deactiveer `affiliate_links.actief=false`, audit-log; `users.rol` blijft.

Bestaande `promote_to_affiliate` / `revoke_affiliate` blijven voor het scenario "puur affiliate" (rol = affiliate, geen partner).

### 4. AuthContext + permissions

- `AuthContext` haalt `get_user_roles(auth.uid())` op en exposeert `profile.rol` (primair, ongewijzigd) + `profile.extraRollen: AppRole[]`.
- Helper `hasRole(profile, rol)` in `src/lib/permissions.ts`: true als `profile.rol === rol || profile.extraRollen?.includes(rol)`.
- ProtectedRoute / route-guards die `rol === 'affiliate'` checken → vervangen door `hasRole(profile, 'affiliate')`. Geen enkele andere rolcheck wijzigen.

### 5. Navigatie

`getNavigation(profile)` (i.p.v. alleen `rol`):

- Bouw eerst de groepen voor de **primaire** rol (ongewijzigd).
- Als `extraRollen` `'affiliate'` bevat: voeg de affiliate-groep uit `affiliateNav()` toe als **extra sectie** aan het einde ("Affiliate") in plaats van de hele nav te vervangen.
- Geen wijziging voor pure affiliates: hun primaire rol is nog steeds `affiliate` → exact dezelfde nav.

### 6. UI

`PromoteToAffiliateButton`:

- Beslis op basis van `currentRol` + nieuwe prop `extraRollen`:
  - Pure user zonder partner-rol → bestaande "Maak affiliate" flow (overschrijft rol).
  - User mét partner-rol (`partner_admin/partner_staff/adviseur/backoffice/installateur`) → label **"Affiliate-module toevoegen"** → roept `add_affiliate_role` aan; bevestigt expliciet dat huidige rol behouden blijft.
  - User die affiliate-module al heeft → "Affiliate-module verwijderen" → `remove_affiliate_role`.
- `Gebruikers.tsx` / `GebruikerDetail.tsx`: rol-badge ongewijzigd, extra badge "Affiliate" als gebruiker een extra rol heeft.

### 7. Sales-manager-zichtbaarheid

Geen wijziging nodig: de bestaande `sales_admin_*` RLS-policies op `affiliate_terugbel_afspraken`, `affiliate_leads` etc. werken al ongeacht of de eigenaar puur affiliate is of hybride. De sales-agenda haalt afspraken op basis van `collega_user_id` / affiliate user_id — `user_roles`-rij zorgt ervoor dat `user_has_role(..., 'affiliate')` true is en de policies dus matchen.

### 8. Verificatie

1. Database-test (read_query): als `esteban@cenora.nl` `user_roles`-rij krijgt, levert `get_user_roles` `[partner_admin, affiliate]`, blijft `users.rol = partner_admin` en `partner_id` gevuld.
2. Frontend-test (Playwright):
   - Login als esteban → primair partner-dashboard zichtbaar (klanten, offertes), extra sectie "Affiliate" in nav, `/affiliates/...` routes openen zonder redirect.
   - Affiliate-link wordt aangemaakt en zichtbaar in `/affiliates`.
   - Login als bas (sales-manager) → ziet esteban in sales-agenda als affiliate, kan diens platform-afspraken zien/bewerken; partner-data van cenora blijft buiten beeld (geen wijziging in partner-policies).
3. Negatieve test: `add_affiliate_role` zonder superadmin → 403; `user_roles` insert via supabase-client als non-superadmin → RLS-fout.

## Niet in scope

- Promotie van pure affiliate → partner-admin (omgekeerde richting).
- Multi-role voor andere combinaties dan `+ affiliate` (uitbreidbaar via dezelfde infrastructuur als later nodig).
- Bestaande affiliate-only gebruikers migreren naar de nieuwe structuur — die blijven werken op `users.rol`.

## Bestandenoverzicht

- `supabase/migrations/<ts>_user_roles_additive.sql` — tabel, RLS, `user_has_role`, `get_user_roles`, RLS-updates op affiliate-tabellen.
- `supabase/functions/user-management/index.ts` — nieuwe acties `add_affiliate_role` / `remove_affiliate_role`.
- `src/contexts/AuthContext.tsx` — laad `extraRollen`.
- `src/lib/permissions.ts` — `hasRole` helper.
- `src/lib/navigation/navigationModel.ts` — `getNavigation(profile)` met extra-secties.
- `src/components/ProtectedRoute.tsx` — affiliate-routes via `hasRole`.
- `src/components/affiliate/PromoteToAffiliateButton.tsx` — nieuwe modus voor hybride toevoeging.
- `src/pages/Gebruikers.tsx` + `GebruikerDetail.tsx` — extra affiliate-badge.
