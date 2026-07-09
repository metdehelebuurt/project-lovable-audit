## Doel
De trial-signup e2e vanaf de frontpage soepel, juridisch correct en robuust maken.

## Wijzigingen

### 1. Frontpage — `src/pages/Index.tsx`
Vervang de lege boilerplate door een compacte, on-brand landingspagina:
- Hero met kop "Alle software voor je verduurzamingsbedrijf op één plek", subtekst, en twee primaire CTA's: **"Start 30 dagen gratis"** (→ `/signup`) en **"Inloggen"** (→ `/login`).
- Drie feature-tegels (Leads, Offertes, Installaties) — hergebruik bestaande design-tokens (primary purple), geen nieuwe fonts/kleuren.
- Footer met link naar voorwaarden/privacy (bestaande routes `/voorwaarden`, `/privacy`).
- Mobile-first, semantische HTML, één `<h1>`.
- `useDocumentSeo` voor `<title>` + meta description.
- Als user al ingelogd is → redirect naar `/dashboard` (zelfde patroon als Signup.tsx).

### 2. Voorwaarden-akkoord — `src/pages/Signup.tsx`
- Nieuwe `akkoord` boolean state + verplichte checkbox onderaan formulier: "Ik ga akkoord met de [algemene voorwaarden](/voorwaarden) en het [privacybeleid](/privacy)".
- Submit-knop `disabled` totdat aangevinkt.
- Toast bij niet-aangevinkt.

### 3. Backend-validatie — `supabase/functions/trial-signup/index.ts`
- Voeg `toestemming: boolean` toe aan payload; return 400 als niet `true`.
- Sla `toestemming_op = now()` op in `partners.voorwaarden_geaccepteerd_op` (nieuwe kolom, zie migratie).
- Vervang losse `if (!bedrijfsnaam …)` door Zod-schema (consistent met andere edge functions).

### 4. Migratie
Één kolom toevoegen aan `public.partners`:
- `voorwaarden_geaccepteerd_op timestamptz` (nullable).
Geen policy-wijziging nodig.

Én een RPC voor atomic clicks-increment:
```sql
create or replace function public.increment_affiliate_link_clicks(_link_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.affiliate_links set clicks = coalesce(clicks,0) + 1 where id = _link_id;
$$;
grant execute on function public.increment_affiliate_link_clicks(uuid) to service_role, authenticated;
```

### 5. Atomic clicks in `trial-signup`
Vervang de read-modify-write op regel 129-132 door:
```ts
await supabaseAdmin.rpc("increment_affiliate_link_clicks", { _link_id: affLink.id });
```

### 6. Post-signup UX — `src/pages/Signup.tsx`
Na succesvolle signup + auto-login:
- Toast: **"Welkom! We hebben een welkomstmail gestuurd naar {email}."** (geeft mail-status weer).
- Navigeer naar `/onboarding`.
- Bij `loginError`: extra info-toast "Log in met je e-mail en wachtwoord."

## Verificatie
- `tsgo` schoon.
- Preview: `/` → CTA klikbaar → `/signup` → checkbox verplicht → account aangemaakt → toast met mail-melding → `/onboarding`.
- Klantkaart van nieuwe trial toont `voorwaarden_geaccepteerd_op` in tijdlijn (optioneel — extra event toevoegen in PartnerDetail timeline).

## Technische notes
- Geen nieuwe dependencies.
- Alle bestanden blijven ruim onder 800 regels; Index.tsx wordt ~150 regels.
- Kleuren via bestaande tokens (`bg-primary`, `text-foreground`); geen hardcoded hex.
- Nederlands, geen emoji's in UI-copy.
