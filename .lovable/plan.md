

# Fix: "Fout 400: redirect_uri_mismatch" bij Gmail-koppeling

## Diagnose

Google's foutmelding `redirect_uri_mismatch` betekent: de `redirect_uri` die wij naar Google sturen staat **niet** in de lijst met "Geautoriseerde omleidings-URI's" van jouw OAuth Client ID in Google Cloud Console.

**Wat de app op dit moment naar Google stuurt** (regel 115-116 in `EmailConfiguratie.tsx`):
```
https://xmguipmetciwvzeyxugu.supabase.co/functions/v1/email-oauth-callback
```

Dit is de URL waar Google de gebruiker naar terug moet sturen na consent. Google vergelijkt deze URI **letterlijk teken-voor-teken** met wat in jouw OAuth-client geregistreerd staat. Een puntje, een trailing slash of http-vs-https verschil = mismatch.

## Oorzaak

De OAuth Client ID die je in Google Cloud Console hebt aangemaakt, heeft deze redirect-URI nog **niet** (of niet exact gelijk) in de lijst staan. Dit is een **configuratie-issue in Google Cloud Console**, niet in de code.

## Oplossing — 1 actie van jouw kant

### Voeg de redirect-URI toe in Google Cloud Console

1. Ga naar **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Open jouw OAuth 2.0 Client ID (waar je `GOOGLE_EMAIL_CLIENT_ID` vandaan komt)
3. Bij **Authorized redirect URIs** → klik **+ ADD URI**
4. Plak **exact** deze waarde (kopieer precies, geen trailing slash, geen extra spaties):

```
https://xmguipmetciwvzeyxugu.supabase.co/functions/v1/email-oauth-callback
```

5. Klik **SAVE**
6. Wacht ~1 minuut (Google's cache moet verversen) en probeer opnieuw te koppelen

### Controleer ook deze randvoorwaarden in Google Cloud Console

| Check | Verwacht |
|---|---|
| **OAuth consent screen** → Publishing status | "In production" óf jouw eigen Google-account staat als **Test user** als hij op "Testing" staat |
| **OAuth consent screen** → User type | "External" (tenzij Google Workspace-only) |
| **Enabled APIs** | **Gmail API** moet geactiveerd zijn voor het project |
| **Scopes** | `gmail.send`, `gmail.readonly`, `gmail.modify`, `userinfo.email` |
| **Application type** van de OAuth-client | "Web application" (NIET "Desktop") |

## Wat ik aan code-kant ga verbeteren

Geen functionele wijziging — de redirect-URI is correct. Wel een kleine UX-verbetering:

**Bestand**: `src/components/instellingen/EmailConfiguratie.tsx`

- Bij de Gmail- en Outlook-knoppen een kleine info-tooltip / helptekst tonen met de **exact te registreren redirect-URI**, zodat dit soort fouten in de toekomst direct zelf op te lossen is.
- Als de OAuth-popup binnen 2 sec sluit zonder bericht, een toast tonen: *"Koppeling onderbroken — controleer of de redirect-URI correct geregistreerd staat in Google Cloud Console: `<URI>`"*

## Niets wijzigen aan

- `email-oauth-callback` Edge Function — die is correct
- `email-oauth-config` Edge Function — die levert de juiste client_id
- De redirect-URI zelf — die mag niet veranderen

## Stappen na bevestiging

1. **Jij**: voegt de redirect-URI toe in Google Cloud Console (1 minuut werk)
2. **Ik**: voeg helpteksten + betere foutdetectie toe in `EmailConfiguratie.tsx`
3. **Samen testen**: opnieuw "Gmail koppelen" klikken — consent screen → groen "E-mail gekoppeld!" blok met `info@smartaccu.nl`

