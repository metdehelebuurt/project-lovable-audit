
# Meerdere e-mail- en agenda-accounts per gebruiker

Vandaag kan één gebruiker maar één actief `email_accounts`-record en één `google_calendar_accounts`-record hebben. Doel: meerdere gekoppelde accounts naast elkaar, met één primair per gebruiker, keuze bij verzenden en samengevoegde agenda-weergave.

## 1. Database

**`email_accounts`**
- Voeg toe: `is_primair boolean not null default false`, `label text` (bijv. "Werk", "Privé"), `laatst_gebruikt_op timestamptz`.
- Verwijder impliciete "één per user"-aanname; behoud `actief`.
- Partial unique index: `create unique index on email_accounts (user_id) where is_primair and actief;` — max één primair per gebruiker.
- Trigger `ensure_single_primary_email`: bij insert/update met `is_primair=true` de andere accounts van dezelfde user op `false` zetten; bij eerste actief account automatisch `is_primair=true`; bij deactiveren/verwijderen van het primaire account een ander actief account promoveren.

**`google_calendar_accounts`**
- Identieke uitbreiding: `is_primair`, `label`, `laatst_gesynced_op` (bestaat mogelijk al — hergebruiken).
- Zelfde partial unique index + trigger `ensure_single_primary_calendar`.
- `google_calendar_event_mapping.calendar_account_id uuid references google_calendar_accounts(id)` toevoegen zodat events per account herleidbaar zijn (nullable, backfill = huidig actief account per user).

**`email_routing_config`**
- Blijft; `bron='gebruiker_persoonlijk'` mapt op het **primaire** account. Nieuwe optie: `email_account_id` per user opslaan is al mogelijk via `specifiek_account`.

Migratie regelt ook: bestaande unieke `actief=true` accounts worden `is_primair=true`.

## 2. Edge functions

- **`email-oauth-callback`**: verwijder "één actief account per user"-logica; nieuwe koppeling wordt actief maar wordt alleen primair als de user er nog geen heeft. Reset `state`-flow ondersteunt reeds meerdere providers.
- **`google-calendar-oauth-callback`**: idem — sta meerdere Google-accounts per user toe (uniek op `(user_id, google_email)`), eerste = primair.
- **`resolve-email-sender.ts`**:
  - `pickUserAccount(uid)` selecteert nu eerst `is_primair=true`, dan meest recent gebruikt.
  - Nieuwe optionele parameter `preferredAccountId` zodat verzendfuncties een expliciete keuze meegeven.
- **`send-offerte-email`, `send-factuur-email`, `send-orderbevestiging-email`, `send-installatie-bevestiging-email`, `inkoop-verzend-leverancier`, `email-api-send`**: accepteren optioneel `from_account_id` en geven dit door aan `resolveEmailSender`.
- **`google-calendar-sync-push` / `sync-pull` / `webhook` / `renew-channels`**: itereren over alle actieve accounts per user in plaats van `.maybeSingle()`. Nieuwe events worden geschreven naar het **primaire** agenda-account tenzij anders bepaald (per-entiteit veld later mogelijk).
- **`google-calendar-disconnect`**: vereist `account_id`; promoveert een ander account tot primair indien nodig.
- **`affiliate-busy-blocks`**: verzamelt busy-blocks over alle gekoppelde agenda's van de affiliate en dedupt.

## 3. Frontend

### E-mail koppeling (`src/components/gebruikers/EmailKoppelingWizard.tsx`)
- Toon **lijst** van gekoppelde accounts i.p.v. één kaart. Elk item: provider-badge, adres, label (inline te bewerken), "Primair"-badge, knoppen: *Maak primair*, *Synchroniseer*, *Ontkoppelen*.
- Knop "Nieuw account koppelen" met provider-keuze (Google/Microsoft) — hergebruikt bestaande OAuth-start.
- Gebruikt nieuwe hook `useEmailAccounts(userId)` (list + setPrimair + rename + disconnect).

### Verzenddialogen (offerte-, factuur-, orderbevestiging-, inkoop-, chat-mailer)
- Nieuwe `<SenderPicker>` component: dropdown "Verstuur vanaf" met alle actieve accounts van de gebruiker, standaard = primair. Value wordt als `from_account_id` meegegeven.
- `InkoopVerzendDialog.tsx` toont nu ook meerdere mailboxen; waarschuwing "geen mailbox" alleen als lijst leeg.

### Agenda
- Nieuwe pagina/section **Instellingen → Agenda's**: lijst van gekoppelde Google-accounts met dezelfde acties (primair, label, ontkoppelen, opnieuw koppelen).
- `StepAgenda.tsx` in onboarding: toont lijst + "Extra Google-agenda koppelen".
- Team-agenda + `useSalesBusyBlocks` blijven ongewijzigd qua interface; edge function aggregeert onderliggend.
- Agenda-kleur per account (extra veld `kleur` op `google_calendar_accounts`) zodat evenementen visueel herleidbaar zijn in Vandaag/Planning kaarten.

### Routing-instellingen (`src/hooks/instellingen/useEmailRouting.ts`)
- Bij `bron='specifiek_account'` toon dropdown met álle actieve accounts van álle partner-users (bestaand).
- Nieuwe helptekst: "Gebruiker persoonlijk" = het primaire adres van de aangemelde gebruiker.

## 4. Migratiestrategie
1. SQL-migratie (kolommen, indexes, triggers, backfill).
2. Types regenereren.
3. Edge functions aanpassen + deployen (`email-*`, `google-calendar-*`, alle `send-*`, `inkoop-verzend-leverancier`, `affiliate-busy-blocks`).
4. Frontend hooks + UI.
5. Tests: unit voor primary-trigger (via `supabase--read_query`), Playwright voor koppelen van tweede account en versturen vanaf niet-primair adres.

## 5. Buiten scope
- Delegated send (namens collega) — blijft via bestaande `agenda_delegaties`.
- CalDAV / iCloud providers.
- Per-entiteit vaste agenda-koppeling (bijv. installaties altijd naar agenda X) — apart follow-up.
