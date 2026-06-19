## Doel
Klachten van Hoang (Smartaccu): e-mailkoppeling werkt nog onbetrouwbaar. Audit van de huidige stack onthult een aantal echte bugs en blinde vlekken. Plan: (1) bugs/edge-cases hardenen in backend, (2) checklist uitbreiden met concrete foutdetails + fix-suggesties per stap, (3) E2E test.

## Gevonden bugs / zwakke plekken

1. **`email-oauth-config` controleert alleen client_id, niet client_secret** — als secret ontbreekt faalt token exchange met cryptische fout. UI denkt "configured".
2. **`email_accounts` upsert `onConflict: "user_id,provider"`** — organisatie-accounts (`user_id = null`) kunnen onbedoeld op elkaar overschrijven of juist niet upserten (NULL ≠ NULL). Voor partner-default mailbox is dit problematisch.
3. **`pickPartnerDefault` in `resolve-email-sender.ts`** valt terug op `user_id IS NULL` — als enige gekoppelde account een persoonlijk account is, faalt routing met "Geen mailbox beschikbaar" zonder duidelijke hint.
4. **`email-api-sync` slikt fouten** (`catch { console.error }`) → gebruiker weet niet dat sync faalt. Geen `last_sync_error` veld.
5. **Token refresh fouten** worden niet teruggekoppeld → account blijft "actief" terwijl refresh_token revoked is. Geen `needs_reauth` markering.
6. **Geen scope-validatie**: account kan gekoppeld zijn zonder `gmail.send` / `gmail.modify` / `gmail.readonly`, en faalt pas bij eerste send/sync.
7. **Checklist toont alleen ✓ / ○** — geen reden waarom een stap "open" staat, geen suggestie hoe te fixen, geen testknop.
8. **`recentSent` query gebruikt `created_at`** in checklist — kolom heet in `email_berichten` `datum`. Mogelijk false negative.
9. **OAuth popup-onderbreking**: huidige melding suggereert alleen redirect_uri, niet "client_secret ontbreekt" of "scopes geweigerd".
10. **Geen "stuur testmail" knop** in onboarding — verzending kan pas indirect via lead-flow worden getest.

## Wijzigingen

### Backend
- **`email-oauth-config/index.ts`**: ook `secretConfigured` returnen (booleans `clientId`, `clientSecret`, `configured = beide`).
- **DB migratie**: voeg toe op `email_accounts`:
  - `last_sync_error TEXT`
  - `last_sync_error_at TIMESTAMPTZ`
  - `needs_reauth BOOLEAN DEFAULT FALSE`
  - Partial unique index: `UNIQUE (partner_id, provider) WHERE user_id IS NULL` (organisatie-accounts) en `UNIQUE (user_id, provider) WHERE user_id IS NOT NULL`.
- **`email-oauth-callback`**: verifieer dat alle gevraagde scopes daadwerkelijk teruggegeven worden; toon waarschuwing-pagina als scopes ontbreken. Reset `needs_reauth = false` op succesvolle koppeling.
- **`email-api-sync`**: vang fouten per account op en schrijf naar `last_sync_error` + `needs_reauth` (bij `invalid_grant`).
- **`_shared/email-send.ts` `refreshOAuthToken`**: bij `invalid_grant` / `invalid_request` zet `needs_reauth=true` + duidelijke errormessage.
- **`resolve-email-sender.ts`**: laatste fallback = "eerste actieve account van partner" (ipv enkel `user_id IS NULL`). Bij geen account: duidelijke foutmessage met routing-context.
- **Nieuwe edge function `email-config-diagnose`**: returnt per stap: status (`ok`/`warning`/`fail`), reden, suggestie. Bundelt: OAuth env-check, default-account check, scopes check, recente send/sync, sync-errors. Vermijdt N+1 queries vanuit UI.

### Frontend
- **`EmailOnboardingChecklist.tsx`** herbouwen:
  - Haalt data uit nieuwe `email-config-diagnose` Edge Function.
  - Per stap: status-icoon (✓/⚠/✗), korte reden ("Refresh-token geweigerd: koppel Gmail opnieuw"), expandable details (originele errormessage, betrokken account-id).
  - **Per stap "Fix nu"-knop**: spring naar relevante kaart (Koppelen/Routing/Accounts) of trigger actie (Sync nu, Stuur testmail naar mezelf).
  - Knop "Stuur testmail naar mezelf" → roept `email-api-send` met partner-default + `to = ingelogde user email`.
  - Toont per gekoppeld account: scopes-badge, laatste sync, `last_sync_error`, `needs_reauth` waarschuwing met "Opnieuw koppelen" actie.
  - Bug fix: `datum` ipv `created_at`.
- **`EmailAccountsBeheer.tsx`**: badge "Herkoppelen nodig" als `needs_reauth=true`, toon `last_sync_error` als tooltip.

### E2E test
- `/tmp/browser/email-hardening/test.py`: login partner_admin → open Instellingen → E-mail → verifieer dat checklist alle 6 stappen toont met status, dat "Stuur testmail" knop reageert, dat ontbrekende routing een ⚠ met fix-link toont.

## Bestanden
**Nieuw (3):** `supabase/functions/email-config-diagnose/index.ts`, migratie voor `email_accounts` velden + indexes, `tests/email-hardening/test.py` (E2E).

**Aangepast (7):** `EmailOnboardingChecklist.tsx` (herbouw), `EmailAccountsBeheer.tsx` (reauth-badge), `email-oauth-config/index.ts`, `email-oauth-callback/index.ts` (scope-verify), `email-api-sync/index.ts` (error capture), `_shared/email-send.ts` (refresh markeer needs_reauth), `_shared/resolve-email-sender.ts` (fallback fix).

## Out of scope
- Volledig nieuwe OAuth UI / wizard
- Per-bericht delivery tracking (Mailgun-stijl bounce hooks)
- Microsoft Graph delta-sync verbetering
