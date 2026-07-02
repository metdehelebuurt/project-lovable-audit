## Doel

Sales manager één overzicht geven van **alle geplande demo-afspraken** van álle affiliates, inclusief de demo's die op dit moment al gepland staan. Geen dubbele bron; we lezen dezelfde tabel die de affiliates zelf ook vullen.

## Bron

`affiliate_terugbel_afspraken` met `type = 'demo'`. RLS staat sales managers al toe alles te lezen (policy `sales_admin_full_access` op basis van `is_sales_admin`), dus er is geen schemawijziging nodig — bestaande demo's verschijnen automatisch.

## UI

### Nieuwe tab "Demo's" in `AffiliateBeheer` (`/affiliate-beheer`)

Toegevoegd naast de bestaande tabs (Affiliates / Referrals / Kortingscodes / Koude leads / Uitbetalingen / Instellingen).

Layout:

- **Filterbalk**: periode (Vandaag / Deze week / Alle open / Historie), affiliate-dropdown (alle affiliates).
- **KPI-rij**: aantal demo's vandaag, deze week, achterstallig, afgehandeld deze maand.
- **Groepen** (vergelijkbaar met affiliate-agenda, maar globaal):
  - Achterstallig — rood
  - Vandaag — amber
  - Komende 7 dagen — blauw
  - Later — grijs
  - Afgehandeld (optioneel, alleen bij filter "historie") — groen
- Per rij: bedrijfsnaam + contactpersoon (join op `affiliate_leads`), datum/tijd, affiliate-eigenaar, notitie, badges (Demo, "Aan collega toegewezen" wanneer `collega_user_id` gevuld en ≠ affiliate_id), en snelle acties: openen lead, e-mailen, afvinken.

### Dashboard-tegel

Nieuwe app-tegel in `src/lib/dashboard/apps.ts` voor sales_manager + superadmin: **"Geplande demo's"** met url `/affiliate-beheer?tab=demos`, categorie `planning`, kleur violet. Op de sales manager z'n dashboard staat de tegel dus direct zichtbaar; klik = tab pre-geselecteerd via querystring.

## Technische wijzigingen

- Nieuwe hook `src/hooks/affiliate/useAlleDemoAfspraken.ts`: haalt via één query alle rijen op met `type='demo'`, joined met `affiliate_leads(bedrijfsnaam, contactpersoon, telefoon, email)` en `users:affiliate_id(voornaam, achternaam, email)`. Filters (periode, affiliate) worden client-side toegepast op de resultaten — snel genoeg voor de te verwachten volumes.
- Nieuwe component `src/components/affiliate/DemoOverzicht.tsx` met filterbalk, KPI's en groepen.
- `AffiliateBeheer.tsx`: extra `TabsTrigger`/`TabsContent` "Demo's"; `defaultValue` blijft `affiliates`, maar via `?tab=demos` in de URL wordt de demo-tab actief.
- `src/lib/dashboard/apps.ts`: nieuwe app-entry voor "Geplande demo's".
- Afvinken hergebruikt bestaande `useAfvinkenTerugbel`.

## Uit scope

- Kalenderweergave (list-first).
- Bulk-herplannen.
- Notificaties bij nieuwe demo (kan later via bestaande notificatie-triggers).
