## Doel

Bas (sales manager) krijgt volledige zichtbaarheid en plancontrole over alle affiliates: hij ziet en bewerkt platform-afspraken in hun agenda, en ziet alleen "bezet"-blokken voor afspraken die de affiliate zélf in zijn Google-agenda heeft gezet (zonder titel, locatie of deelnemers).

## Wat al klopt

- `affiliate_terugbel_afspraken` heeft al een `sales_admin_full_access`-policy — sales_manager kan dus read/insert/update/delete op álle rijen. RLS is dus oké.
- `google_calendar_accounts` bewaart access/refresh-tokens per gebruiker. Service-role kan namens elke gekoppelde affiliate Google-calls doen.
- Affiliate-agendapagina toont nu alleen eigen + aan-mij-toegewezen terugbel-afspraken.

## Wat nog ontbreekt (en hier wordt gebouwd)

### 1. Database / RLS

- Functie `public.is_sales_manager_or_super(uid)` (bestaat al via `is_sales_admin`) — niets te doen.
- Nieuwe view `public.v_affiliates_voor_sales_manager` met `id, voornaam, achternaam, email, has_google_calendar` zodat de UI alle affiliates kan tonen zonder users-tabel direct te lezen.
- Geen wijziging aan `afspraken` (die tabel is voor partner-flow, niet voor affiliate-flow).

### 2. Edge function: `affiliate-busy-blocks` (nieuw)

- Input: `{ affiliate_ids: uuid[], from: ISO, to: ISO }`
- Auth: alleen `is_sales_admin(auth.uid())` of `is_superadmin` — anders 403.
- Voor elke affiliate met actieve `google_calendar_accounts`-rij: roept Google `freeBusy` aan via opgeslagen refresh-token (service-role), refresht access-token wanneer verlopen.
- Output: `{ [affiliate_id]: [{ start, end }, ...] }` — alléén tijdvakken, geen titel/details.
- Faalt graceful per affiliate: kan één calendar de freeBusy niet ophalen, dan staat die affiliate op `null` met `error`-veld; rest werkt door.
- Caching: korte in-function memo (60s) tegen rate limits.

### 3. Edge function: `affiliate-afspraak-plannen` (nieuw)

- Input: `{ affiliate_id, lead_id, type ('terugbel'|'demo'), geplande_op, duur_minuten, notitie }`
- Auth: alleen `is_sales_admin(auth.uid())`.
- Maakt rij in `affiliate_terugbel_afspraken` (met sales_manager als `collega_user_id` zodat affiliate de afspraak ook ziet als "aan mij toegewezen").
- Als affiliate Google heeft gekoppeld én `sync_afspraken=true`: maakt Google-event + mapping-rij. Reden voor edge function: clientcode kan affiliate's tokens niet aanraken; alleen service-role mag dat.
- Bij Google-fout: platform-afspraak blijft staan, edge function geeft `{ created: true, google_sync: 'failed', message }` terug. Geen halve writes.

### 4. UI: nieuwe sales-manager planning-pagina

- Route: `/sales/agenda` (alleen voor `sales_manager`/`superadmin`).
- **Affiliate-picker** (multi-select) → lijst van alle affiliates met Google-koppel-icoon.
- **Week-/dagweergave** (react-day-picker bestaat al) met per affiliate een rij:
  - Platform-afspraken: volledige kaart (lead-naam, type, notitie, knoppen "Bewerken", "Verzetten", "Annuleren").
  - Externe Google-events: grijs blok "Bezet" met alleen begin/eind. Geen on-click detail.
- **"Afspraak plannen"-knop** opent dialog met affiliate-keuze, lead-keuze, type (terugbel/demo), datum/tijd, duur, notitie → roept `affiliate-afspraak-plannen` aan.

### 5. Hardening / tests

- Negatieve tests in `tests/sales-agenda.spec.ts`:
  - Affiliate-account roept `affiliate-busy-blocks` → 403.
  - Affiliate-account leest een platform-afspraak van een andere affiliate via REST → RLS denied.
  - Bas roept `affiliate-busy-blocks` met onbekende affiliate-id → lege array, geen crash.
  - Bas plant een afspraak voor affiliate zonder Google-koppeling → `google_sync: 'skipped'`, platform-rij staat.
- Edge-function unit test (Deno) voor de refresh-token-flow en het maskeren van event-details.
- Build & typecheck gate moet groen draaien voordat we klaar zeggen.

## Bestanden die wijzigen / nieuw

```text
supabase/migrations/<ts>_sales_manager_agenda.sql        (view + grants)
supabase/functions/affiliate-busy-blocks/index.ts        (nieuw)
supabase/functions/affiliate-busy-blocks/index_test.ts   (nieuw)
supabase/functions/affiliate-afspraak-plannen/index.ts   (nieuw)
supabase/functions/affiliate-afspraak-plannen/index_test (nieuw)
src/hooks/sales/useSalesAgenda.ts                        (nieuw)
src/hooks/sales/useAffiliatesMetAgenda.ts                (nieuw)
src/pages/sales/SalesAgenda/index.tsx                    (nieuw)
src/pages/sales/SalesAgenda/AffiliatePicker.tsx          (nieuw)
src/pages/sales/SalesAgenda/AgendaWeek.tsx               (nieuw)
src/pages/sales/SalesAgenda/PlanAfspraakDialog.tsx       (nieuw)
src/App.tsx                                              (route toevoegen)
src/lib/navigation/navigationModel.ts                    (menu-item voor sales_manager)
tests/sales-agenda.spec.ts                               (nieuw)
```

## Volgorde van uitvoering

1. Migratie (view + grants) — review en goedkeuren.
2. Edge functions `affiliate-busy-blocks` + `affiliate-afspraak-plannen` + Deno-tests.
3. Hooks + UI-pagina.
4. Playwright e2e tegen lokale dev-server, daarna build + typecheck.
5. Pas afronden als alle tests groen zijn — geen "100% resultaat" zonder bewijs.

## Open vragen vóór ik bouw

1. **Duur van een afspraak**: hard 30 min voor "terugbel" en 45 min voor "demo", of altijd configureerbaar in de dialog? (Default: configureerbaar, voorinstelling per type.)
2. **Mag de sales-manager bestaande affiliate-afspraken *bewerken/annuleren*** óók als die door de affiliate zelf op het platform zijn aangemaakt? Aanname: ja (anders is "onder zich hebben" inhoudelijk leeg).
3. **Reikwijdte affiliates**: álle users met `rol = 'affiliate'` (ongeacht partner), of alleen die actief zijn (`status='actief'`)? Aanname: alleen actief.

Bevestig vraag 1–3, dan begin ik met de migratie.