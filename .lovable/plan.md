

## Plan: Fix Google Login Flow & Dashboard Redirect

### Probleem analyse
Er zijn twee problemen:

1. **`redirect_uri` is verkeerd** — De `redirect_uri` staat op `${origin}/dashboard`, maar moet `window.location.origin` zijn (de Lovable OAuth handler op `/~oauth` doet de callback). Na de OAuth redirect landt de gebruiker op `/dashboard` voordat de sessie is gezet.

2. **Geen navigatie na succesvolle Google login** — Na `lovable.auth.signInWithOAuth` (non-redirect flow) wordt er niet genavigeerd naar `/dashboard`. De functie stopt gewoon.

3. **Login/Signup pagina's redirecten niet als gebruiker al ingelogd is** — Als je al een sessie hebt en op `/login` landt, blijf je daar hangen.

### Oplossing

**1. Fix `redirect_uri` in Login.tsx en Signup.tsx**
- Verander `redirect_uri` van `${origin}/dashboard` naar `window.location.origin`

**2. Navigeer na succesvolle Google sign-in**
- Na `lovable.auth.signInWithOAuth` — als geen error en niet redirected, navigeer naar `/dashboard`

**3. Auto-redirect op Login & Signup pagina's**
- Voeg `useEffect` toe: als `user` en `profile` bestaan (en niet loading), redirect naar `/dashboard`

### Bestanden

| Actie | Bestand |
|-------|---------|
| Edit | `src/pages/Login.tsx` — Fix redirect_uri, navigeer na succes, auto-redirect als al ingelogd |
| Edit | `src/pages/Signup.tsx` — Zelfde fixes |

### Geen database wijzigingen nodig

