
## Bevindingen RLS-audit feedback-module

Drie lekken gevonden waardoor gewone gebruikers (consument, affiliate, partner_staff, adviseur, installateur) feedback van anderen kunnen zien:

1. **`feedback_verzoeken` → policy "Partner users zien partner feedback"**: iedere geauthenticeerde user ziet álle feedback van zijn partner-organisatie (via `partner_id = get_user_partner_id(auth.uid())`).
2. **`feedback_verzoeken` → policy "Roadmap publiek leesbaar"**: `anon` én `authenticated` mogen alle niet-gearchiveerde, niet-afgewezen feedback lezen — incl. titel + beschrijving + indieners-vrije tekst.
3. **`feedback_reacties` → policy "Partner ziet partner reacties niet-intern"**: zelfde partner-leak voor reacties. En de INSERT-policy laat een user reageren op elke feedback waar zijn partner_id matcht.

## Aanpak (jouw keuze)

- **Roadmap volledig privé**: anon-toegang verdwijnt, geen brede roadmap-zichtbaarheid meer.
- **Toegestane brede zichtbaarheid**: alleen `superadmin` (alles) en `sales_manager` (alles). `partner_admin` ziet alleen feedback binnen eigen `partner_id`. Alle overige rollen (partner_staff, adviseur, installateur, consument, affiliate, backoffice) zien uitsluitend hun eigen ingediende items.

## Database-migratie (één migratie, alleen RLS — geen schema-wijziging)

**`feedback_verzoeken`**
- DROP policy `Partner users zien partner feedback`
- DROP policy `Roadmap publiek leesbaar`
- REVOKE SELECT ON `public.feedback_verzoeken` FROM `anon`
- BEHOUD policy `Users zien eigen feedback` (eigen `user_id`)
- BEHOUD policy `Superadmin ziet alle feedback`
- NIEUWE policy `Sales manager ziet alle feedback` → `public.is_sales_manager(auth.uid())`
- NIEUWE policy `Partner admin ziet partner feedback` → `user_has_role(auth.uid(), 'partner_admin') AND partner_id = get_user_partner_id(auth.uid())`
- UPDATE policy `Admin bewerkt feedback`: `user_id = auth.uid() OR is_superadmin(...) OR is_sales_manager(...) OR (partner_admin van eigen partner)` — eigen indiener houdt bewerkrecht; partner_staff verliest het.

**`feedback_reacties`**
- DROP policy `Partner ziet partner reacties niet-intern`
- BEHOUD `Indiener leest eigen niet-interne reacties` + `Superadmin alles op feedback_reacties`
- NIEUWE policy `Sales manager leest reacties` (alle niet-interne reacties)
- NIEUWE policy `Partner admin leest partner reacties` (niet-intern, feedback hoort bij eigen partner)
- VERVANG INSERT-policy: user mag alleen reageren op feedback waarvan `fv.user_id = auth.uid()` (of superadmin/sales_manager/partner_admin van eigen partner)

**`feedback_stemmen`** — laat ongewijzigd: stemmen mag iedereen blijven (anders breekt voting op eigen feedback). SELECT-policy is `true` → niet kritiek want bevat geen content, alleen tellingen via `feedback_verzoeken.stemmen` kolom (RLS-gefilterd).

## Frontend-gevolgen

`src/pages/FeedbackOverzicht.tsx`, `FeedbackRoadmap.tsx`, `FeedbackDetail.tsx` doen `select *` zonder eigen filtering — RLS doet het werk. Geen code-changes nodig voor de privacy zelf.

Wel checken in een tweede stap (na migratie):
- `FeedbackRoadmap.tsx`: pagina was bedoeld als publieke roadmap. Nu wordt het effectief een "mijn feedback + status"-lijst voor externe users. Beslis later of die route überhaupt nog zinvol is voor consument/affiliate, of dat hij alleen voor admin/sales_manager moet blijven (UI-aanpassing, geen security).
- `FeedbackDetail.tsx` toont reacties via `ReactiesThread`; werkt automatisch met de strakkere RLS.

## Validatie na migratie

1. `supabase--linter` draaien.
2. Read-query met `auth.uid()` simuleren via service role: bevestigen dat zonder superadmin/sales_manager/partner_admin-rol alleen rijen met `user_id = auth.uid()` terugkomen.
3. Bevestigen dat `anon` 0 rijen krijgt op `feedback_verzoeken`.

Geen data-migratie nodig; alleen policies en één GRANT-revoke.
