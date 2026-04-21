
# Plan — Onboarding & installatie wizard

## Doel
Eén centrale wizard `/welkom` waar gebruikers stap-voor-stap hun account compleet maken: persoonlijke gegevens, e-mailaccount koppelen + testen, handtekening, voorkeuren en (voor partner-admins) organisatie-instellingen. Bestaande velden worden vóór-ingevuld, en koppelingen kunnen live getest worden.

## Wanneer wordt de wizard getoond?
- **Automatisch na eerste login** als `users.onboarding_voltooid_op IS NULL`. Dashboard redirect dan eenmalig naar `/welkom`.
- **Altijd handmatig** opnieuw te starten via knop "Onboarding opnieuw starten" op `/profiel` en in `OnboardingChecklist`.
- Wizard mag overgeslagen worden ("Later afmaken"), maar `OnboardingChecklist` blijft tonen wat ontbreekt.

## Stappen (rol-bewust)

| # | Stap | Voor wie | Inhoud |
|---|---|---|---|
| 1 | **Welkom** | iedereen | Korte intro, voortgangsbalk, "Aan de slag" |
| 2 | **Persoonlijke gegevens** | iedereen | voornaam, achternaam, telefoon, functie, avatar-upload — vóór-ingevuld uit `users` |
| 3 | **E-mailaccount koppelen** | iedereen | Hergebruik `EmailKoppelingWizard` + nieuwe **"Koppeling testen"** knop die een test-mail naar eigen adres stuurt via `email-api-send` en bevestiging toont |
| 4 | **E-mailhandtekening** | iedereen | Hergebruik `HandtekeningEditor` met live preview |
| 5 | **Voorkeuren** | iedereen | Notificatie-voorkeuren (e-mail/in-app), taal (NL default), tijdzone, dark/light theme |
| 6 | **Organisatie-instellingen** | alleen `partner_admin` / `superadmin` | Bedrijfsnaam, KvK, BTW, adres, logo-upload, hoofdkleur — vóór-ingevuld uit `partners`. Met **"Logo & branding testen"** preview |
| 7 | **Beveiliging** | iedereen | Wachtwoord wijzigen (optioneel), tweestapsverificatie aanzetten (link naar bestaande MFA-flow indien aanwezig — anders alleen toggle) |
| 8 | **Klaar** | iedereen | Samenvatting met groene vinkjes, knop "Naar dashboard". Markeert `onboarding_voltooid_op = now()` |

Stap 6 wordt overgeslagen voor niet-admin rollen.

## Test-functies (live verificatie)

| Connectie | Hoe getest |
|---|---|
| E-mailaccount (Gmail/Outlook) | Edge function `email-api-send` stuurt test naar eigen `email_adres` met onderwerp "Testbericht onboarding". Toont ✅ als `200`, anders foutmelding |
| E-mailhandtekening | Live HTML-preview onder editor (geen send nodig) |
| Logo/branding (stap 6) | Toont mini-PDF-header preview met huidige `logo_url` + kleur |
| Avatar | Upload → direct preview als ronde thumbnail |

## Database

Nieuwe migratie:
```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_voltooid_op timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_overgeslagen_op timestamptz,
  ADD COLUMN IF NOT EXISTS voorkeuren jsonb DEFAULT '{}'::jsonb;
```

`voorkeuren` JSONB houdt: `{ taal, tijdzone, thema, notif_email, notif_inapp }`. Bestaande velden (`avatar_url`, `telefoon`, `functie`, `handtekening_html`, `mfa_enabled`) worden hergebruikt.

Geen RLS-wijziging nodig — `users`-tabel heeft al policies voor self-update.

## Frontend

### Nieuwe bestanden

| Bestand | Doel | Limiet |
|---|---|---|
| `src/pages/Onboarding.tsx` | Wizard-shell met routing tussen stappen, voortgangsbalk, "Later afmaken"-knop | ≤ 200 regels |
| `src/components/onboarding/StepWelkom.tsx` | Welkomstscherm | ≤ 60 |
| `src/components/onboarding/StepProfiel.tsx` | Persoonlijke gegevens + avatar upload | ≤ 180 |
| `src/components/onboarding/StepEmail.tsx` | Wrapper rond `EmailKoppelingWizard` + test-knop | ≤ 140 |
| `src/components/onboarding/StepHandtekening.tsx` | Wrapper rond `HandtekeningEditor` | ≤ 80 |
| `src/components/onboarding/StepVoorkeuren.tsx` | Notificaties, taal, thema, tijdzone | ≤ 160 |
| `src/components/onboarding/StepOrganisatie.tsx` | Bedrijfsgegevens + logo + kleur (alleen admins) | ≤ 220 |
| `src/components/onboarding/StepBeveiliging.tsx` | Wachtwoord + MFA toggle | ≤ 140 |
| `src/components/onboarding/StepKlaar.tsx` | Samenvatting + voltooien | ≤ 100 |
| `src/components/onboarding/useOnboardingState.ts` | Centrale form-state hook (laden bestaande data, opslaan per stap) | ≤ 200 |
| `src/components/onboarding/EmailTestKnop.tsx` | Verstuurt test-mail via `email-api-send` en toont resultaat | ≤ 80 |

### Wijzigingen in bestaande bestanden

| Bestand | Wijziging |
|---|---|
| `src/App.tsx` | Route `/welkom` toevoegen binnen `ProtectedRoute` (zonder `AppLayout` voor schone wizard-look — eigen header) |
| `src/pages/Dashboard.tsx` | `useEffect` redirect naar `/welkom` als `profile.onboarding_voltooid_op === null && profile.onboarding_overgeslagen_op === null` |
| `src/contexts/AuthContext.tsx` | `UserProfile` interface uitbreiden met `onboarding_voltooid_op`, `onboarding_overgeslagen_op`, `voorkeuren` |
| `src/components/gebruikers/OnboardingChecklist.tsx` | Knop "Doorloop wizard" → `/welkom` |
| `src/pages/Profiel.tsx` | Knop "Onboarding opnieuw starten" |

### Vóór-invullen logica
`useOnboardingState` haalt bij mount één keer:
- `users` rij van ingelogde gebruiker → vult stap 2, 4, 5, 7
- `email_accounts` waar `user_id` + `actief=true` → bepaalt of stap 3 al ✓ is
- `partners` rij van `partner_id` (alleen voor admins) → vult stap 6

Per stap wordt op "Volgende" alleen het gewijzigde deel opgeslagen; de gebruiker kan nooit data verliezen.

## Niet wijzigen
- `EmailKoppelingWizard` zelf (alleen wrappen)
- `HandtekeningEditor` zelf (alleen wrappen)
- Bestaande RLS-policies
- Mollie / rolherstructurering / module-overrides

## Volgorde van uitvoering
1. Database-migratie (3 kolommen op `users`)
2. `useOnboardingState` hook + types update in `AuthContext`
3. Wizard-shell `Onboarding.tsx` + route in `App.tsx`
4. Stappen 1, 2, 3 (incl. `EmailTestKnop`) — basisflow werkt
5. Stappen 4, 5, 6, 7, 8
6. Auto-redirect in `Dashboard.tsx` + opnieuw-starten-knoppen

## Resultaat
- Nieuwe gebruikers worden bij eerste login direct door een professionele 8-staps wizard geleid
- Bestaande velden worden vóór-ingevuld → niemand vult ooit dubbel in
- E-mailkoppeling kan live getest worden met een echte testmail naar eigen adres
- Partner-admins krijgen extra organisatie-stap met logo/branding-preview
- Wizard kan altijd opnieuw of overgeslagen worden — geen lock-in
