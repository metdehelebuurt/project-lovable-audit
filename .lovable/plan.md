

# Fix: Gmail koppelen — "Missing required parameter: client_id"

## Oorzaak

`EmailConfiguratie.tsx` bouwt zelf de Google OAuth-URL met een hardcoded leeg `clientId = ""` (regel 93 en 96). Daardoor ontvangt Google geen `client_id` en weigert het verzoek met "Fout 400: invalid_request". Bovendien zijn er nog geen Google/Microsoft OAuth-credentials in de backend opgeslagen — die zijn hoe dan ook nodig voor de token-exchange in `email-oauth-callback`.

## Aanpak (in lijn met bestaande patronen)

We gebruiken het bestaande proxy-patroon (zoals `google-maps-config`): een nieuwe Edge Function levert de **publieke** `client_id` op aanvraag aan de frontend. De `client_secret` blijft strikt server-side in de bestaande callback-functie. Geen `VITE_`-vars voor OAuth-keys.

### Stap 1 — Secrets toevoegen
Vier nieuwe secrets in Lovable Cloud opvragen via `add_secret`:
- `GOOGLE_EMAIL_CLIENT_ID` (publiek, mag in OAuth-URL)
- `GOOGLE_EMAIL_CLIENT_SECRET` (geheim, alleen server-side)
- `MICROSOFT_EMAIL_CLIENT_ID` (optioneel, alleen als Outlook-koppeling ook werkend moet)
- `MICROSOFT_EMAIL_CLIENT_SECRET` (optioneel)

De gebruiker maakt deze aan in:
- **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application)** met als geautoriseerde redirect URI: `https://xmguipmetciwvzeyxugu.supabase.co/functions/v1/email-oauth-callback` en scopes `gmail.send`, `gmail.readonly`, `gmail.modify` + `userinfo.email`.
- (Optioneel) **Microsoft Entra → App registrations**, zelfde redirect URI, Mail.Read + Mail.Send + offline_access scopes.

### Stap 2 — Nieuwe Edge Function `email-oauth-config`
Levert de publieke `client_id`'s aan de frontend (vergelijkbaar met `google-maps-config`):
```ts
return { google: { clientId, configured: !!clientId },
         microsoft: { clientId, configured: !!clientId } }
```
Geregistreerd in `supabase/config.toml` met `verify_jwt = true` (alleen ingelogde gebruikers).

### Stap 3 — `EmailConfiguratie.tsx` aanpassen
- Bij mount: `client_id`'s ophalen via de nieuwe Edge Function en in state zetten.
- `startOAuth(provider)` gebruikt deze `client_id`'s. Als een provider niet geconfigureerd is, knop disabled + heldere toast: *"Gmail-koppeling is nog niet geactiveerd. Configureer eerst de OAuth-credentials."*
- `user_id` toevoegen aan `state` (komt uit `useAuth()`), nu nog leeg.

### Stap 4 — Verificatie van bestaande callback
`email-oauth-callback` is functioneel correct, maar:
- Toevoegen van CORS-header `Access-Control-Allow-Origin` voor de redirect-fase.
- Behoudt `verify_jwt = false` (Google roept hem aan zonder JWT).

### Stap 5 — End-to-end test
Na fix: in preview ingelogd als `info@smartaccu.nl` → Instellingen → E-mail → Gmail koppelen → Google-popup → consent → "E-mail gekoppeld!" toast → groen-blok met `info@smartaccu.nl` zichtbaar.

## Bestanden

| Bestand | Actie |
|---|---|
| `supabase/functions/email-oauth-config/index.ts` | NIEUW — proxy levert publieke client_id's |
| `supabase/config.toml` | + registratie `email-oauth-config` (verify_jwt = true) |
| `src/components/instellingen/EmailConfiguratie.tsx` | client_id ophalen via fetch, gebruiken in `startOAuth`, knop disablen als niet-geconfigureerd, `user_id` meesturen in state |
| `supabase/functions/email-oauth-callback/index.ts` | kleine fix: betere foutafhandeling als secrets ontbreken (al aanwezig, alleen toast-tekst verbeteren) |

## Bevestiging nodig

- **Microsoft/Outlook ook nu inrichten of alleen Google?** (Outlook-knop kan tijdelijk disabled blijven met "binnenkort beschikbaar".)
- **Wie maakt de Google OAuth-credentials in Google Cloud Console aan?** Ik kan stap-voor-stap instructies geven; jij plakt vervolgens de client_id en client_secret in de secret-prompts die ik open.

