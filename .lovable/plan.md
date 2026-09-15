# Administratie & abonnementenbeheer met blokkade bij wanbetaling

Uitbreiding van de bestaande beheeromgeving (Abonnementenbeheer) met een debiteuren-/administratiedeel waarin je per klant de betaalstatus ziet en klanten kunt blokkeren. Een geblokkeerde klant kan niet meer in het systeem werken.

## Wat je krijgt

**Nieuw tabblad "Administratie" in Abonnementenbeheer**
- Lijst met alle klantorganisaties en hun betaalstatus: openstaand bedrag, oudste onbetaalde factuur, aantal dagen te laat.
- Filters: alles / achterstallig / geblokkeerd.
- Kleurmarkering: op tijd, te laat (1-14 dagen), ernstig te laat (15+ dagen), geblokkeerd.
- Knop **Blokkeren** per klant: reden invullen (bijv. "wanbetaling factuur 2026-0142"), bevestigen.
- Knop **Deblokkeren** met reden, zodra betaald is.
- Blokkadegeschiedenis per klant (wie, wanneer, waarom, gedeblokkeerd op).

**Wat een geblokkeerde klant ziet**
- Bij inloggen of tijdens het werken verschijnt een blokkadescherm: uitleg dat de toegang is opgeschort wegens openstaande betaling, het openstaande bedrag, contactgegevens en een uitlogknop. Alle andere schermen zijn niet meer bereikbaar.
- Platformbeheerders (superadmin) worden nooit geblokkeerd.

## Technisch

**Database (migratie)**
- `partners`: `geblokkeerd_op timestamptz`, `geblokkeerd_reden text`, `geblokkeerd_door_id uuid`. De bestaande `partner_status`-enum bevat al `geblokkeerd`; die waarde wordt gezet bij blokkeren en teruggezet naar `actief` bij deblokkeren.
- Nieuwe tabel `partner_blokkades` (partner_id, actie `blokkeren|deblokkeren`, reden, uitgevoerd_door_id, created_at) + GRANT's (`authenticated` select, `service_role` all) + RLS: alleen superadmin leest/schrijft.
- Security-definer functie `public.partner_is_geblokkeerd(_user uuid) returns boolean` — leest de partnerstatus van de gebruiker. Wordt gebruikt door de frontendgate en is beschikbaar voor toekomstige RLS-aanscherping.
- Restrictieve RLS-policy op de kerntabellen `leads`, `offertes`, `opdrachten`, `installaties`, `facturen`: schrijven (insert/update/delete) is niet toegestaan als de partner geblokkeerd is. Lezen blijft technisch mogelijk zodat exports/administratie kloppen, maar de UI toont enkel het blokkadescherm.

**Frontend**
- `src/hooks/administratie/usePartnerAdministratie.ts` — TanStack Query: partners + openstaande `facturen` geaggregeerd (openstaand bedrag, dagen te laat).
- `src/hooks/administratie/usePartnerBlokkade.ts` — mutaties blokkeren/deblokkeren via Edge Function.
- `src/components/administratie/AdministratieOverzicht.tsx` (tabel + filters), `BlokkeerDialog.tsx` (reden verplicht, min. 5 tekens), `BlokkadeHistorie.tsx`.
- Tab "Administratie" toegevoegd in `src/pages/AdminAbonnementen.tsx`.
- `src/components/BlokkadeGate.tsx` — wordt in `AppLayout` boven de routes gezet; toont bij geblokkeerde partner het blokkadescherm in plaats van de app. Superadmin passeert altijd.
- `useAuth`-profiel uitgebreid met de partnerblokkadestatus zodat de gate direct na inloggen werkt.

**Edge Function `partner-blokkade`**
- Zod-validatie (`partner_id`, `actie`, `reden`), controleert via de JWT dat de aanroeper superadmin is, zet de partnerstatus en logt in `partner_blokkades`. Optioneel: melding naar het contact-e-mailadres van de klant bij blokkeren (uit te zetten met een schakelaar in het formulier).

## Buiten scope
- Automatisch blokkeren op basis van betaaltermijn (kan later als geplande taak); nu blokkeer je handmatig vanuit het achterstandsoverzicht.
