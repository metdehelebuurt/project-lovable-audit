## Doel
Als een sales agent (`sales_manager`) een klantkaart opent vanuit het trial-overzicht, moet direct duidelijk zijn:
- **Wie heeft de klant binnengehaald?** (affiliate / referrer of interne sales agent)
- **Wie en wanneer heeft demo-data toegevoegd?**
- **Wanneer loopt de trial en wie heeft deze aangemaakt?**
- **Wat is de huidige status van de klant?** (trial actief / trial verlopen / betalend / geblokkeerd)

## Probleem nu
1. Route `/partners/:id` is beperkt tot `superadmin` → een sales_manager kan de klantkaart helemaal niet openen (klik uit AffiliateTrials leidt naar "toegang geweigerd").
2. `PartnerDetail` toont alleen bedrijfsgegevens; er is geen sales-context (geen aanbrenger, geen trial-aanmaker, geen demo-info).
3. In `trial-signup` wordt `aangemaakt_door` alleen in de welkomstmail gebruikt en niet opgeslagen; er is geen registratie van demo-seed.

## Wijzigingen

### 1. Database (migratie)
Op `public.partners`, drie nieuwe kolommen (nullable, geen breaking change):
- `trial_aangemaakt_door_id uuid` (FK → users.id, on delete set null)
- `trial_aangemaakt_op timestamptz`
- `demo_data_geseed_op timestamptz`
- `demo_data_geseed_door_id uuid` (FK → users.id)

Backfill:
- `trial_aangemaakt_op` = `created_at` voor bestaande trial-partners
- `demo_data_geseed_op` = `created_at` als er demo-notities bestaan (bestaande convention "⚡ Demo:")

RLS: bestaande partner-policies blijven werken (kolommen erven policies). Geen nieuwe policies.

### 2. Edge function `trial-signup`
- Sla `trial_aangemaakt_door_id` (uit sessie/`aangemaakt_door_id` payload) en `trial_aangemaakt_op = now()` op bij partner-insert.
- Na `seedDemoData()`: update partner met `demo_data_geseed_op = now()` en `demo_data_geseed_door_id`.
- Frontend die deze functie aanroept (`SalesManagerTrials` / registratie-flows) meestuurt `aangemaakt_door_id` = huidige user.

### 3. Route-toegang
`src/App.tsx` regel 191-193: `allowedRoles` uitbreiden van `["superadmin"]` naar `["superadmin", "sales_manager"]` voor `/partners/:id` (blijft binnen sales-scope; overzicht `/partners` blijft superadmin-only).

### 4. `src/pages/PartnerDetail.tsx`
Nieuwe compacte **"Klantstatus"** header-strook + één nieuwe card **"Sales & Onboarding"** met vier duidelijke rijen:

```text
┌─ Klantstatus ────────────────────────────────────────┐
│  [ Trial actief · nog 12 dagen ]  [ Demo-data aanwezig ]│
└──────────────────────────────────────────────────────┘

┌─ Sales & Onboarding ─────────────────────────────────┐
│  Aangebracht door   Jan de Vries (affiliate)         │
│                     via link "voorjaar24" · 12-05-26 │
│  Trial aangemaakt   Bas Jansen · 08-07-26 14:22      │
│  Trial periode      08-07-26 → 07-08-26 (12 dagen)   │
│  Demo-data          Geseed door Bas · 08-07-26 14:22 │
└──────────────────────────────────────────────────────┘
```

Data-bronnen:
- **Aangebracht door**: query op `affiliate_referrals` waar `partner_id = :id` → join `users` op `affiliate_id` voor naam + `affiliate_links` voor code. Fallback: "Direct" (geen referral).
- **Trial aangemaakt**: nieuwe kolommen + join `users` op `trial_aangemaakt_door_id`.
- **Trial periode**: bestaande `contract_startdatum` + `trial_einddatum`; bereken resterende dagen; kleurcodering (groen actief, oranje <7 dagen, rood verlopen).
- **Demo-data**: nieuwe kolommen; als niet geseed → grijze "Nog niet geseed" met verwijzing naar knop (bestaande `clear-demo-data` / eventueel seed-actie blijft ongewijzigd).
- **Klantstatus badge**: afgeleide logica: `abonnement_type === 'trial'` + `trial_einddatum` → "Trial actief/verlopen"; anders "Betalend" of huidige `status`-label.

Positionering: nieuwe klantstatus-strook direct onder de titel (voor de bestaande badges), de "Sales & Onboarding" card als eerste kaart in de grid (voor Bedrijfsgegevens).

### 5. Terug-navigatie
`navigate("/partners")` valt om voor sales_manager (geen toegang). Wijzig naar `navigate(-1)` zodat terugkeren naar AffiliateTrials werkt.

## Verificatie
- Build + `tsgo` check.
- Handmatige check via preview: als superadmin trial aanmaken → PartnerDetail toont alle nieuwe velden.
- Rol-switch (sales_manager) → klantkaart opent zonder access-error.

## Technische notes
- Bestandslengte `PartnerDetail.tsx` (218 regels) blijft ruim onder 800; nieuwe "SalesOnboardingCard" sub-component in aparte file als >50 regels functie ontstaat.
- Geen wijziging aan `src/integrations/supabase/client.ts` of `types.ts` (types worden geregenereerd na migratie).
- Geen nieuwe dependencies.
