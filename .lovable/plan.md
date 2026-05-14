# Plan: Google login werkend krijgen op Vercel

## Probleem

`https://www.mijnhuis.nu/~oauth/initiate` geeft 404. Het pad `/~oauth/...` wordt alleen door Lovable hosting onderschept — Vercel kent het niet. We stappen daarom over op **directe Supabase OAuth**, die wél werkt op elk domein.

## Wijzigingen in code

### 1. `src/pages/Login.tsx` en `src/pages/Signup.tsx`
Vervang:
```ts
import { lovable } from "@/integrations/lovable/index";
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin,
});
```
Door:
```ts
import { supabase } from "@/integrations/supabase/client";
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/dashboard` },
});
```
De error-handling/redirect-logica blijft verder hetzelfde (browser redirect doet Supabase zelf).

### 2. Geen wijzigingen aan `AuthContext`
De bestaande `onAuthStateChange` + `provisionGoogleUser` blijft werken — Supabase zet de sessie automatisch na de callback.

## Configuratie buiten de code (jij doet dit)

### Supabase Dashboard (Lovable Cloud → Backend openen)
**Authentication → URL Configuration:**
- **Site URL**: `https://www.mijnhuis.nu`
- **Redirect URLs** (allemaal toevoegen):
  - `https://www.mijnhuis.nu/**`
  - `https://mijnhuis.nu/**`
  - `https://*.lovable.app/**` (voor previews)
  - `http://localhost:*/**` (voor dev)

**Authentication → Providers → Google:**
- Zet provider op **Enabled**
- Vul **Client ID** en **Client Secret** in van je `mijnhuis login` OAuth client (Google Cloud)

### Google Cloud Console
Je `Authorized redirect URIs` zijn al goed — `https://gulxrpbaztweybkljqsp.supabase.co/auth/v1/callback` staat erin. Verder niets nodig.

De `/~oauth/callback` URI's mag je laten staan of weghalen — die worden niet meer gebruikt.

## Resultaat
- Google login werkt op `mijnhuis.nu` (Vercel)
- Werkt ook op de Lovable preview en op een eventueel toekomstig `app.mijnhuis.nu`
- Geen afhankelijkheid meer van Lovable's OAuth-proxy

## Niet in scope
- Geen wijzigingen aan andere auth flows (email/password, password reset)
- Geen wijzigingen aan `google-user-provision` Edge Function
- Lovable managed Apple/SAML SSO blijft beschikbaar als je dat ooit wilt
