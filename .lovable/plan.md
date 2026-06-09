## Doel

Een echt complete onboarding bouwen die nieuwe gebruikers (vooral partner_admins) door alle relevante setup-stappen leidt — met duidelijke uitleg per stap, een logische volgorde, koppelingen voor e-mail en agenda, en initiële configuratievragen die het platform meteen goed instellen.

## Nieuwe stapvolgorde

```text
1.  Welkom               – wat ga je instellen (overzicht + ~5 min indicatie)
2.  Persoonlijk profiel  – foto, NAW, functie, telefoon
3.  Voorkeuren           – taal, tijdzone, thema, notificaties
4.  Organisatie          – bedrijfsnaam, KvK, BTW, adres, logo (admin)
5.  Huisstijl            – primaire kleur + logo donker (admin)
6.  Doelen & focus       – welke modules ga je gebruiken (leads/offertes/schouw/installatie/helpdesk) + maandvolume — bepaalt modules
7.  Team uitnodigen      – e-mailadressen met rolkeuze (admin, optioneel)
8.  E-mail koppelen      – Gmail / Outlook OAuth + testmail
9.  E-mailhandtekening   – gegenereerd voorbeeld + bewerken
10. Agenda koppelen      – Google Calendar OAuth (uitleg sync schouw/installatie)
11. Nummerreeksen        – prefix/start voor offerte, factuur, schouw (admin)
12. Betalingsvoorwaarden – standaard termijn + tekst (admin)
13. Betaalmethode        – Mollie mandate voor abonnement (admin trial)
14. Beveiliging          – MFA inschakelen + wachtwoord-tips
15. Rondleiding          – 4-slide carousel van hoofdmodules op basis van rol
16. Klaar                – checklist + CTA's (eerste lead / dashboard / docs)
```

Voor `installateur`/`monteur` blijft een korte variant: Welkom → Profiel → Voorkeuren → Agenda koppelen → Handtekening → Beveiliging → Klaar.

## Verbeteringen per bestaande stap

- **StepWelkom**: tijdsindicatie, lijstje "wat we gaan instellen", uitleg waarom (deliverability, branding, samenwerking). Knop "Aan de slag" + "Sla over (kan altijd later)".
- **StepProfiel**: extra uitleg waarom (zichtbaar op offertes/e-mails), validatie verplicht voor voornaam/achternaam, helperteksten onder elk veld.
- **StepVoorkeuren**: uitleg per voorkeur, preview van thema-keuze, default `nl` + Europe/Amsterdam.
- **StepOrganisatie**: KvK-lookup hint, logo preview, helpertekst "verschijnt op offertes/facturen/PDF".
- **StepEmail**: duidelijke uitleg verschil OAuth vs SMTP, "Waarom koppelen?" callout (verzenden onder eigen adres + tracking + reply-in-platform), testmail-bevestiging.
- **StepHandtekening**: live preview, optie "auto genereren uit profiel".
- **StepBeveiliging**: stap-voor-stap MFA QR + recoverycodes, optie "later".
- **StepKlaar**: visuele checklist met groene vinkjes per voltooide stap, CTA-tegels "Maak eerste lead", "Nodig team uit", "Bekijk dashboard", "Open helpcentrum".

## Nieuwe stappen (nieuwe bestanden)

- `src/components/onboarding/StepHuisstijl.tsx` – primaire kleur (color picker met live preview chip), logo licht/donker upload.
- `src/components/onboarding/StepDoelen.tsx` – multi-select modules + slider verwacht aantal leads/maand → slaat op in `users.voorkeuren.doelen` en gebruikt voor rondleiding-personalisatie.
- `src/components/onboarding/StepTeam.tsx` – tot 5 rijen (e-mail + rol-select) → roept `user-management` Edge Function aan voor uitnodigingen.
- `src/components/onboarding/StepAgenda.tsx` – wrapper rond bestaande Google Calendar koppeling (start OAuth via `google-calendar-oauth-start`), status check via `google_calendar_accounts`, uitleg over schouw/installatie sync.
- `src/components/onboarding/StepNummerreeksen.tsx` – default reeksen tonen, optioneel aanpassen (prefix + startnummer) → schrijft naar `nummerreeks_config`.
- `src/components/onboarding/StepBetalingsvoorwaarden.tsx` – termijn (14/30/dagen) + tekstblok → `partners.payment_terms` JSONB.
- `src/components/onboarding/InfoCallout.tsx` – herbruikbare uitleg-component (icon + titel + body + optionele leer-meer link).

## Architectuur / state

- `useOnboardingState` uitbreiden:
  - `agendaGekoppeld: boolean` (query `google_calendar_accounts`)
  - `doelen: { modules: string[]; volume: number }` in `users.voorkeuren.doelen`
  - `nummerreeksen` snapshot voor admin
  - `teamUitnodigingen` lokaal
  - Per-stap autosave (debounce 600 ms) zodat "Later afmaken" nooit data verliest.
- `progress` tonen als segmented bar met stap-labels (in plaats van enkel %).
- Skip-knop per stap (rechtsboven binnen wizard) i.p.v. alleen header-skip.

## Uitleg-laag (consistent in elke stap)

Boven de invoer een `InfoCallout`:
- Titel: wat je gaat doen
- Body: waarom (1 zin) + wat het oplevert
- Onderaan stap: link "Meer info" naar relevante helpcentrum-pagina (extern tab).

## Edge functions / backend

- Geen schema-wijzigingen vereist; `users.voorkeuren` is JSONB en `partners` heeft al kleur/logo/payment_terms.
- Hergebruik bestaande functies: `user-management` (team), `google-calendar-oauth-start` (agenda), `email-oauth-config` + `email-oauth-callback` (e-mail), `mollie-create-mandate-checkout` (betaalmethode).
- Geen nieuwe secrets nodig.

## Files die wijzigen

- `src/pages/Onboarding.tsx` – nieuwe steplist + per-rol filter + segmented progress.
- `src/components/onboarding/useOnboardingState.ts` – velden voor doelen, agenda, team, autosave.
- `src/components/onboarding/StepWelkom.tsx` – uitleg + tijdsindicatie.
- `src/components/onboarding/StepProfiel.tsx` – validatie + helpers.
- `src/components/onboarding/StepVoorkeuren.tsx` – uitleg + theme preview.
- `src/components/onboarding/StepOrganisatie.tsx` – helpers + logo preview.
- `src/components/onboarding/StepEmail.tsx` – uitleg-callout.
- `src/components/onboarding/StepHandtekening.tsx` – live preview + auto-generate.
- `src/components/onboarding/StepBeveiliging.tsx` – MFA wizard verbeterd.
- `src/components/onboarding/StepKlaar.tsx` – CTA-tegels + checklist.
- `src/components/onboarding/StepHuisstijl.tsx` *(nieuw)*
- `src/components/onboarding/StepDoelen.tsx` *(nieuw)*
- `src/components/onboarding/StepTeam.tsx` *(nieuw)*
- `src/components/onboarding/StepAgenda.tsx` *(nieuw)*
- `src/components/onboarding/StepNummerreeksen.tsx` *(nieuw)*
- `src/components/onboarding/StepBetalingsvoorwaarden.tsx` *(nieuw)*
- `src/components/onboarding/InfoCallout.tsx` *(nieuw)*

## QA

- Nieuwe partner_admin doorloopt alle 16 stappen, kan elke stap overslaan, data persist.
- Installateur ziet korte variant (7 stappen).
- "Later afmaken" zet `onboarding_overgeslagen_op` en behoudt ingevulde data.
- Onboarding opnieuw starten vanuit profiel werkt en respecteert reeds ingevulde data (toont als al-voltooid in checklist).
- Agenda- en e-mail-koppeling tonen status (verbonden / niet verbonden) en kunnen overgeslagen worden.
