## Situatie

De onboarding-module is grotendeels al gebouwd (`src/pages/Onboarding.tsx` + 9 stap-componenten in `src/components/onboarding/` + state-hook `useOnboardingState`). De database heeft al de kolommen `onboarding_voltooid`, `onboarding_stappen`, `onboarding_voltooid_op`, `onboarding_overgeslagen_op` op `users`.

**Wat ontbreekt:** de route `/onboarding` is niet geregistreerd in `App.tsx`, nieuwe gebruikers worden er niet automatisch heen geleid, en er is geen blijvende toegang ("Onboarding opnieuw doen") vanuit het profiel/dashboard. Daarom is de module nu onbereikbaar.

## Plan

### 1. Route registreren
- In `src/App.tsx` een nieuwe route `/onboarding` toevoegen achter `ProtectedRoute` (alle ingelogde rollen), die `Onboarding.tsx` rendert. Géén `AppLayout` (full-screen wizard, eigen header met logo + voortgangsbalk — al ingebouwd in de page).

### 2. Auto-redirect voor nieuwe gebruikers
- In `AuthContext.tsx` na `loadProfile` extra velden ophalen: `onboarding_voltooid_op`, `onboarding_overgeslagen_op`.
- Een kleine `OnboardingGate`-wrapper rond `ProtectedRoute` (of in `AppLayout`) die redirect naar `/onboarding` als:
  - gebruiker is ingelogd, profiel geladen
  - `onboarding_voltooid_op` IS NULL én `onboarding_overgeslagen_op` IS NULL
  - huidige route is niet al `/onboarding`, `/login`, `/reset-password`, `/profiel`, of een publieke route (`/offerte/:token`, `/oplever/...`, `/embed/...`, `/feedback/...`).
- Rol `consument` slaat de wizard over (gaat direct naar klantportaal).
- Rol `installateur`/`monteur`: korte versie (alleen profiel + handtekening + beveiliging — organisatie-stap wordt al overgeslagen via `isAdmin`).

### 3. Inhoud lichte uitbreiding (bestaande stappen blijven)
De bestaande stappen blijven: Welkom → Profiel → E-mail → Handtekening → Voorkeuren → (Organisatie + Betaalmethode bij admin) → Beveiliging → Klaar. Toevoegen:

- **StepWelkom**: kort 30-sec uitleg-video / animatie placeholder + 3 highlight-tegels (al aanwezig).
- **StepRondleiding** (nieuw, vóór "Klaar"): 4-slide carousel die de hoofdmodules introduceert op basis van rol (Leads, Offertes, Schouw, Planning) met "Open module"-knoppen die in nieuw tabblad openen — zo blijft de wizard intact.
- **StepKlaar**: bij voltooien zet `onboarding_voltooid = true` (boolean) én tijdstempel, en biedt CTA "Eerste lead aanmaken" / "Naar dashboard".

### 4. Herhaalbaar maken
- In `src/pages/Profiel.tsx` een knop "Onboarding opnieuw starten" die de tijdstempels nullt en naar `/onboarding` navigeert.
- `OnboardingChecklist` (al bestaand) tonen op het dashboard zolang niet alle 5 substappen klaar zijn — link naar `/onboarding` ipv alleen profiel.

### 5. Trial-flow koppelen
- In `marketing/trial-signup` flow (bestaand) na succesvolle registratie + auto-login: redirect naar `/onboarding` ipv `/dashboard`.

### 6. QA
- Nieuwe partner_admin: ziet volledige wizard incl. organisatie + betaalmethode.
- Bestaande gebruiker met `onboarding_voltooid_op` gevuld: geen redirect.
- "Later afmaken" zet `onboarding_overgeslagen_op` en gaat naar dashboard; redirect triggert daarna niet meer.
- Onboarding opnieuw starten vanuit profiel werkt.

## Technische details

- Geen schemawijziging nodig — kolommen bestaan.
- Geen nieuwe edge functions.
- `OnboardingGate` is een dunne client-side guard; security blijft op RLS-niveau (geen vervanging van auth).
- Rolspecifieke stappenlijst wordt al berekend in `Onboarding.tsx` via `state.isAdmin`; uitbreiden met `profile.rol` check voor consument/installateur.

## Bestanden die wijzigen

- `src/App.tsx` — route + gate
- `src/contexts/AuthContext.tsx` — onboarding-velden in profiel
- `src/pages/Onboarding.tsx` — rolspecifieke steplist + StepRondleiding
- `src/components/onboarding/StepRondleiding.tsx` *(nieuw)*
- `src/pages/Profiel.tsx` — knop "Onboarding opnieuw starten"
- `src/pages/Dashboard.tsx` — `OnboardingChecklist` integratie (indien nog niet)
- `src/pages/Signup.tsx` of trial-signup pagina — redirect naar `/onboarding`
