# Google Calendar tweerichtings-sync

Elke gebruiker koppelt zijn/haar eigen Google-account. Schouwen, installaties, afspraken en helpdesk-taken (waar de gebruiker verantwoordelijk/toegewezen is) worden automatisch gesynchroniseerd met zijn Google Agenda. Wijzigingen in Google (tijd verzetten, verwijderen) komen terug in het platform.

## Architectuur

```text
Platform DB ──trigger──► sync queue ──edge fn──► Google Calendar API
     ▲                                                   │
     │                                                   ▼
     └──── edge fn (webhook) ◄──push notification─── Google
```

## Stap 1 — Per-user OAuth infrastructuur

**Eigen Google OAuth credentials** (apart van de bestaande Gmail-koppeling, want andere scopes nodig):
- Secrets: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`
- Scope: `https://www.googleapis.com/auth/calendar.events` + `userinfo.email`
- Redirect URI: `https://app.mijnhuis.nu/instellingen/google-calendar/callback`

**Nieuwe tabel `google_calendar_accounts`:**
- `user_id`, `partner_id`, `google_email`, `calendar_id` (target agenda, default 'primary')
- `access_token`, `refresh_token`, `token_expiry`
- `sync_token` (voor incremental sync), `channel_id` + `resource_id` + `channel_expiry` (voor webhooks)
- `sync_schouwen`, `sync_installaties`, `sync_afspraken`, `sync_taken`, `sync_handmatig` (booleans, default true)
- `laatst_gesynchroniseerd_op`, `laatste_fout`

**Nieuwe tabel `google_calendar_event_mapping`:**
- `partner_id`, `user_id`, `entiteit_type` (schouw/installatie/afspraak/taak), `entiteit_id`
- `google_event_id`, `google_etag`, `laatst_gesynchroniseerd_hash`
- Unique op (user_id, entiteit_type, entiteit_id)

## Stap 2 — Edge functions

1. **`google-calendar-oauth-start`** — genereert OAuth-URL met state token
2. **`google-calendar-oauth-callback`** — wisselt code in, slaat tokens op, registreert webhook
3. **`google-calendar-sync-push`** — DB → Google (één entiteit). Aangeroepen door DB-triggers via pg_net
4. **`google-calendar-sync-pull`** — Google → DB (incremental via syncToken)
5. **`google-calendar-webhook`** — ontvangt push notifications van Google, triggert pull
6. **`google-calendar-disconnect`** — verwijdert tokens + webhook channel
7. **`google-calendar-renew-channel`** — cron, vernieuwt webhook-channels die binnen 24u verlopen

## Stap 3 — DB triggers (push naar Google)

Triggers op `schouwen`, `installaties`, `afspraken`, `helpdesk_ticket_taken`:
- INSERT/UPDATE van datum/tijd/toewijzing → roep `google-calendar-sync-push` aan via `net.http_post` voor de toegewezen user
- DELETE → verwijder Google event via mapping

Filteren op: alleen pushen als de toegewezen user een actieve `google_calendar_accounts` row heeft met de relevante sync-toggle aan.

## Stap 4 — UI

**Instellingen → "Google Agenda"** (nieuwe pagina `src/pages/instellingen/GoogleCalendar.tsx`):
- Status: gekoppeld/niet gekoppeld + email-adres
- Knop "Koppel Google Agenda" → opent OAuth flow
- Dropdown: welke agenda als target (lijst via API)
- Toggles per type (schouwen/installaties/afspraken/taken/handmatige afspraken)
- Knop "Nu synchroniseren" (handmatige trigger)
- Sectie "Laatste synchronisatie" + foutmeldingen
- Knop "Ontkoppelen"

**Optioneel later:** handmatige afspraken module — kan via bestaande `afspraken` tabel met type 'algemeen'.

## Stap 5 — Conflict-afhandeling

- Bij UPDATE: vergelijk `etag` van Google met opgeslagen `google_etag`. Mismatch → Google wint voor datum/tijd; platform pusht overige velden.
- Bij DELETE in Google: markeer entiteit-status als 'geannuleerd_extern' (geen harde delete in platform).

## Aanpak (volgorde van bouwen)

1. **Vragen om OAuth credentials** (Google Cloud Console) + secrets toevoegen
2. **Migratie**: 2 nieuwe tabellen + RLS
3. **OAuth start + callback** edge functions
4. **UI instellingenpagina** met koppel/ontkoppel flow
5. **Push sync** (DB → Google) met triggers
6. **Pull sync + webhooks** (Google → DB)
7. **Channel-renewal cron** + handmatige sync-knop
8. **Test end-to-end** met testaccount

## Technisch (intern)

- OAuth state token: HMAC-signed met `user_id` + timestamp om CSRF te voorkomen
- Token refresh: lazy bij elke API-call als `token_expiry < now()`
- Rate limits Google Calendar: 1M queries/dag, 600/min per user — ruim genoeg, maar batch waar mogelijk
- Webhook TTL: max 7 dagen, cron vernieuwt elke 6 dagen
- Bestandsstructuur respecteert max 800 regels/bestand; edge functions blijven puur en gefocust per verantwoordelijkheid

## Wat ik nu nodig heb van jou

Voordat ik begin: je moet **eigen OAuth credentials** aanmaken in Google Cloud Console (de workspace-connector werkt niet voor per-user OAuth). Stappen volgen zodra je dit plan goedkeurt.
