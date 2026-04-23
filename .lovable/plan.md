

## Plan — Verwijderen van gebruikers loopt vast op dubbele delete

### Root cause

Bij het verwijderen van `roshny@smartaccu.nl` (en andere users) faalt de edge function `user-management` met `400`. De analyse:

1. **Foreign keys zijn al goed**: alle 41 FK's naar `public.users` staan correct op `SET NULL` of `CASCADE` na de vorige migratie. Voor deze user zijn er bovendien 0 blokkerende records.
2. **Echte oorzaak — dubbele delete in de edge function**: 
   - Stap 1: `await supabaseAdmin.from("users").delete().eq("id", user_id)` — succesvol.
   - Cascade-effect: `public.users.id` heeft `ON DELETE CASCADE` naar `auth.users(id)` (constraint `users_id_fkey`). Door stap 1 verdwijnt de **auth-row automatisch mee**.
   - Stap 2: `await supabaseAdmin.auth.admin.deleteUser(user_id)` — faalt want de auth-user bestaat al niet meer. Retourneert error → frontend ziet `400`.
3. **Eén overgebleven NO ACTION FK**: `abonnement_wijzigingen.user_id → auth.users(id)`. Voor deze user leeg, maar kan in de toekomst andere deletes blokkeren.

### Oplossing

**A. Edge function `user-management` — delete-volgorde omdraaien**
- Verwijder eerst via `auth.admin.deleteUser(user_id)`. De `ON DELETE CASCADE` op `public.users.id` ruimt dan automatisch de profiel-rij + alle CASCADE-tabellen (notificaties, affiliate_links, etc.) op, en SET NULL-tabellen behouden hun historie.
- Vang `auth.admin.deleteUser` errors op:
  - `"User not found"` → behandel als success (idempotent).
  - Postgres `23503` (FK violation) → vriendelijke 400-melding ("nog gekoppeld aan…").
  - Overig → 500 met message.
- Verwijder de losse `public.users` delete-stap (overbodig door CASCADE).

**B. Database-migratie — laatste NO ACTION FK opruimen**
- `abonnement_wijzigingen.user_id` → wijzig van `NO ACTION` naar `SET NULL` (kolom is nullable, historie blijft behouden).

**C. Geen UI-wijziging nodig**
- `Gebruikers.tsx` is al consistent met de edge function-allowlist na de vorige fix.

### Bestanden
- `supabase/functions/user-management/index.ts` — `delete_user` case herschrijven (volgorde + idempotente errorhandling).
- `supabase/migrations/<timestamp>_abonnement_wijzigingen_fk_set_null.sql` — één ALTER TABLE.

### Niet-doelen
- Geen wijziging aan andere edge function-acties.
- Geen RLS-aanpassingen.
- Geen UI-wijzigingen.

