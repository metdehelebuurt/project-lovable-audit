## Doel

Bij het inplannen van een terugbelafspraak of demo kan de affiliate kiezen voor welke interne collega de afspraak is. Daarna krijgen **zowel de klant als de gekozen collega** automatisch een bevestigingsmail in de mijnhuis.nu-huisstijl, via de ingebouwde Lovable-mailinfrastructuur (`send-transactional-email`).

## Wat er gebouwd wordt

### 1. Database — kolom toevoegen aan `affiliate_terugbel_afspraken`

Eén nieuwe kolom:
- `collega_user_id uuid null` — referentie naar `auth.users.id`; wie de afspraak uitvoert.

Migratie zet ook een index op `collega_user_id` voor latere weergave ("mijn afspraken") en update geen bestaande rijen (blijft `null`).

### 2. Hook collega's

Nieuwe hook `src/hooks/affiliate/useInterneCollegas.ts` die actieve gebruikers binnen dezelfde partner ophaalt uit `users` (naam, email, id). Filter op rollen die afspraken kunnen oppakken: `partner_admin`, `partner_staff`, `adviseur`. Affiliate zelf staat ook in de lijst (handig als hij zichzelf wil toewijzen).

### 3. UI — `TerugbelDialog.tsx` uitbreiden

Veld toevoegen tussen "Datum en tijd" en "Notitie":
- Label: **"Voor welke collega?"**
- shadcn `Select` met de lijst uit de hook, default leeg ("Kies een collega").
- Verplicht voor zowel terugbel als demo (anders geen mailbevestiging mogelijk).

`useCreateTerugbel` krijgt het extra veld `collega_user_id` door. Na opslaan triggert dezelfde mutation de mailfunctie (één edge-call die intern beide mails verstuurt — zie 5).

### 4. E-mailtemplates (huisstijl mijnhuis.nu)

Twee nieuwe React-Email templates onder `supabase/functions/_shared/transactional-email-templates/`:

- `affiliate-afspraak-klant.tsx` — naar de klant.
  Onderwerp dynamisch: *"Bevestiging terugbelafspraak"* of *"Bevestiging demo-afspraak"*.
  Props: `klantNaam`, `type` (`terugbel`|`demo`), `gepland` (ISO), `collegaNaam`, `notitie`.
- `affiliate-afspraak-collega.tsx` — naar de collega.
  Onderwerp: *"Nieuwe terugbelafspraak voor jou"* / *"Nieuwe demo voor jou"*.
  Props: `collegaNaam`, `klantNaam`, `klantEmail`, `klantTelefoon`, `type`, `gepland`, `notitie`, `affiliateNaam`.

Beide templates gebruiken dezelfde mijnhuis-stijl als de bestaande `afspraak-ingepland.tsx` (kleuren, logo, button, footer). Datum/tijd weergegeven in `Europe/Amsterdam` via `Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", … })` — sluit aan op bestaande tijdzone-aanpak.

Beide templates worden geregistreerd in `_shared/transactional-email-templates/registry.ts`.

### 5. Edge Function — `affiliate-afspraak-notify`

Nieuwe functie die de hele notify-flow encapsuleert (zodat de client maar één call doet):

Input (JSON):
```
{ afspraakId: string }
```

Stappen:
1. JWT valideren via Supabase client met user-token.
2. Afspraak ophalen (`affiliate_terugbel_afspraken` join `leads` join `users` voor collega + affiliate).
3. Idempotency-key = `affiliate-afspraak-${afspraakId}` (zo voorkomen we dubbele mails bij retry).
4. Twee `supabase.functions.invoke("send-transactional-email", …)` calls:
   - naar klant met `affiliate-afspraak-klant`
   - naar collega met `affiliate-afspraak-collega`
5. Korte JSON-response `{ ok: true }`.

Geen mail wanneer klant geen e-mailadres heeft (alleen collega), idem omgekeerd — en duidelijke log/toast richting de affiliate als één van beide mist.

### 6. Client-aanroep

In `useCreateTerugbel` na succesvolle insert: `supabase.functions.invoke("affiliate-afspraak-notify", { body: { afspraakId } })`. Failure van de mail blokkeert de UI-flow niet, maar toont een waarschuwings-toast ("Afspraak opgeslagen, maar mailbevestiging mislukt").

### 7. Deploy

Na alle bestand-wijzigingen `deploy_edge_functions` voor:
- `affiliate-afspraak-notify` (nieuw)
- `send-transactional-email` (template-registry is veranderd)

## Aannames (graag bevestigen indien anders)

- Klant-e-mail staat al op `leads` (kolom `email` of vergelijkbaar) — anders gebruik ik wat er is.
- "Interne collega" = actieve `users`-rij binnen dezelfde `partner_id` als de affiliate.
- Afzender = bestaande email-domein (mijnhuis.nu) dat al voor app-emails is geconfigureerd.

## Out of scope

- Kalender-uitnodiging (.ics) — kan in vervolg.
- Wijzigen/annuleren van afspraak met nieuwe mails — kan in vervolg.
