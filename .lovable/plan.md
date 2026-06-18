# Automatische herinneringen voor (bijna) verlopen offertes

Partners kunnen per organisatie instellen dat klanten automatisch een herinneringsmail krijgen X dagen vóór en/of Y dagen ná de verloopdatum van hun offerte. Een dagelijkse cronjob doet het werk, mét logging om dubbele verzending te voorkomen.

## 1. Database (migratie)

**Nieuwe tabel `public.offerte_auto_herinnering_config`** (één rij per partner)
- `partner_id` (uuid, unique, FK partners)
- `actief` (bool, default false)
- `dagen_voor_verloop` (int[], default `{2}`) — meerdere momenten mogelijk
- `dagen_na_verloop` (int[], default `{1,7}`)
- `email_template_id` (uuid, FK `email_templates`, nullable)
- `alleen_werkdagen` (bool, default true)
- standaard timestamps

**Nieuwe tabel `public.offerte_auto_herinnering_log`**
- `offerte_id` (uuid, FK offertes)
- `partner_id` (uuid)
- `fase` (text: `voor_verloop` / `na_verloop`)
- `dag_offset` (int) — bv. -2 of +7
- `verzonden_op` (timestamptz)
- unique `(offerte_id, fase, dag_offset)` voorkomt dubbele sends

**RLS + GRANTs**
- config: partner_admin/backoffice (= `is_admin_tier`) van eigen partner read/write; service_role full
- log: lezen door partner-medewerkers van eigen partner; insert alleen service_role
- Beide met `GRANT` voor authenticated + service_role

Bestaande tabel `offerte_herinneringen` (handmatige opvolg-taken) blijft ongemoeid — andere functie.

## 2. Edge Function `cron-send-quote-reminders`

Dagelijks om 09:00 via pg_cron (`pg_cron` + `pg_net` aanzetten, cron via `supabase--insert` zodat anon key niet in migratie staat).

Logica:
1. Loop partners met `actief = true`.
2. Voor elk geconfigureerd `dagen_voor_verloop` / `dagen_na_verloop`-offset bereken doel-`geldig_tot` = `current_date + offset` (voor) of `current_date - offset` (na).
3. Selecteer offertes: `partner_id` match, `status IN ('verzonden','openstaand')` (NIET `geaccepteerd`/`afgewezen`/`geconverteerd_extern`/`concept`), `geldig_tot` matcht, klant heeft e-mail.
4. Skip als regel bestaat in `offerte_auto_herinnering_log` voor `(offerte_id, fase, dag_offset)`.
5. Indien `alleen_werkdagen` en vandaag weekend → skip.
6. Roep bestaande `send-offerte-email` (of `send-transactional-email` indien template-based) aan met het geconfigureerde sjabloon.
7. Insert log-rij + `log_entity_change('offerte', …, 'herinnering_verzonden', …)` voor de tijdlijn.
8. Foutafhandeling per offerte: catch + `system_error_logs`, doorgaan met rest.

## 3. Frontend

**Nieuw `src/pages/instellingen/OfferteHerinneringen.tsx`** (route + sidebar-link in instellingen)
- shadcn `Card` met:
  - `Switch` "Automatische herinneringen inschakelen"
  - Tag-input / multi-number voor dagen vóór en ná verloop
  - `Select` e-mail template (verplicht vóór activatie — validatie via Zod + React Hook Form)
  - `Switch` "Alleen op werkdagen versturen"
  - Opslaan-knop, toasts in NL
- Data via TanStack Query (`useQuery` + `useMutation`), Supabase client, partner_id via `useAuth().profile.partner_id`

**Offerte-detail (`src/pages/OfferteDetail.tsx`)**
- In bestaande historie/tijdlijn-sectie tonen automatische herinneringen (komt gratis uit `entiteit_historie` door `log_entity_change`).
- Kleine "Herinnering verzonden op …"-badge (`src/components/offertes/AutoHerinneringBadge.tsx`) op basis van laatste log-rij.
- Bestaande handmatige "Stuur herinnering"-knop blijft.

Geen wijziging aan handmatige `OfferteHerinneringen` component.

## 4. Edge cases
- Geen `geldig_tot` → niet meegenomen door query.
- Status geaccepteerd/afgewezen → uitgesloten in WHERE.
- Klant zonder e-mail → skip + log waarschuwing.
- Switch kan alleen aan met geldig template (frontend + DB-trigger-validatie).
- Dubbele cron-run zelfde dag → unique index op log blokkeert tweede insert.

## 5. Oplevering
Eén zin voor de gebruiker na implementatie:
"Je kunt nu automatische offerte-herinneringen instellen via Instellingen → Offerte herinneringen; klanten ontvangen automatisch een mail vóór of na het verlopen van hun offerte."

## Niet in scope
- Per-offerte override van schema (kan later)
- A/B varianten van templates
- SMS/WhatsApp kanalen
