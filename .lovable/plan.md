## Doel

De sales manager 1 werkdag van tevoren attenderen op elke demo/trial die de dag erna gepland staat, zodat hij kan nabellen (no-show voorkomen), verzetten of een herinneringsmail sturen.

## Waar

Alles landt in het bestaande demo-overzicht (`AffiliateBeheer` → tab "Demo's"). Geen nieuwe pagina, wel een prominente sectie plus actieknoppen per rij.

## Wijzigingen in de UI (`DemoOverzicht.tsx`)

1. **KPI-tegel "Morgen"** toegevoegd in de bovenste rij (naast Achterstallig / Vandaag / Komende 7 dagen / Afgerond deze maand). Werkdag-slim: op vrijdag = maandag; anders = kalender-morgen.
2. **Sectie "Morgen — nabellen voor no-show"**, violet gemarkeerd, komt boven "Achterstallig". Toont alle open demo's die op de volgende werkdag vallen. Compacte call-to-action links: **Bel**, **Verzet**, **Reminder mailen**.
3. **Verzet-dialog** — kleine dialog met datum-tijd-picker. Update `geplande_op` op `affiliate_terugbel_afspraken` (RLS via `sales_admin_full_access` staat dit toe). Bij succes: query invalideren en toast.
4. **Reminder mailen** — knop roept een nieuwe edge function `affiliate-afspraak-reminder` aan met `afspraakId`. Toast bij succes/falen. Verstuur alleen naar de klant; de affiliate ziet het in de tijdlijn via bestaande logging.
5. **Automatische signalering** — voor elke rij die op de volgende werkdag valt, een kleine violette "Morgen"-badge in alle secties (ook als de filter breder staat).

Optioneel: In de dashboard-tegel "Geplande demo's" tonen we een klein aantal-badge (aantal demo's morgen) via dezelfde hook; als dat te veel kost skippen we het en houden we het bij de KPI in het overzicht.

## Nieuwe edge function `affiliate-afspraak-reminder`

- Input: `{ afspraakId: string }`.
- Auth: JWT verplicht; toegestaan als de aanroeper `superadmin` of `sales_manager` is, of eigenaar/collega van de afspraak (bestaande `is_sales_admin` check hergebruiken via SQL, of `has_role`).
- Haalt afspraak + lead + affiliate op, valideert `type='demo'`, valideert dat de datum in de toekomst ligt en dat er nog niet binnen 12 uur eerder een reminder is verstuurd (nieuw kolommetje `reminder_verstuurd_op` staat al klaar via `reminder_24u_op` / `reminder_1u_op` — we gebruiken `reminder_24u_op` als marker).
- Stuurt via bestaand pad (dezelfde SendGrid/notify-implementatie in `affiliate-afspraak-notify`) een klant-reminder met tijd, contactgegevens en optionele meeting-link (uit `notitie`).
- Schrijft `reminder_24u_op = now()` terug.
- Response: `{ ok: true, klantEmail }`.

CORS + input-validatie met Zod (min: `afspraakId` als UUID).

## Frontend hooks

- `useAlleDemoAfspraken` uitbreiden zodat het ook `reminder_24u_op` teruggeeft — zo kunnen we tonen "Reminder al verstuurd om 09:12".
- Nieuwe `useVerzetAfspraak` (update `geplande_op`) en `useStuurReminder` (invoke edge function).

## Uit scope

- Push- of in-app notificaties. Zichtbaarheid via het dashboard-tegel + KPI volstaat voor v1.
- Aparte trial-agenda (trials zijn al `type='demo'` in `affiliate_terugbel_afspraken`).
- Automatisch versturen via cron; dat kan later bovenop hetzelfde edge function endpoint.
