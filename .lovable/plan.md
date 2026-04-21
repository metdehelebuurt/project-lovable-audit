
# Plan — A: voorschot bij handmatige factuur + B: rolherstructurering met Backoffice

## Deel A — Voorschot/termijn bij handmatig aangemaakte factuur

### Probleem
In `FactuurNieuw.tsx` wordt `TermijnFactuurSelector` alleen getoond als er een `offerteContext` is. Bij een handmatig aangemaakte verkoopfactuur (zonder offerte) ontbreekt de mogelijkheid om subtype "voorschot" of "eindafrekening" te kiezen.

### Aanpak
1. In `FactuurNieuw.tsx` een **subtype-keuzeblok** tonen ook zonder offertecontext, met:
   - Radio: Reguliere factuur / Voorschotfactuur / Eindafrekening
   - Bij voorschot: optionele velden "Termijn X van Y" + "Totaal projectbedrag" (voor PDF-context)
   - Bij eindafrekening zonder offerte: tekstuele toelichting + handmatige verrekenregels (negatieve bedragen via `DocumentRegelEditor`)
2. `factuur_subtype` correct meegeven aan de insert in `financiele_documenten`
3. `generate_financieel_documentnummer` met subtype `'voorschot'` aanroepen → krijgt `VS-YYYY-XXXX` nummer
4. Subtype-badge consistent tonen op `FactuurDetail` (al aanwezig — alleen verifiëren dat handmatige variant ook klopt)

### Bestanden
| Bestand | Actie |
|---|---|
| `src/pages/FactuurNieuw.tsx` | Subtype-blok altijd tonen; conditie `offerteContext` verwijderen rond selector |
| `src/components/financieel/HandmatigeVoorschotVelden.tsx` | **Nieuw** — termijn-nummer + totaal-projectbedrag inputs (max 80 regels) |

## Deel B — Rolherstructurering + nieuwe rol "Backoffice"

### Doel
- Nieuwe rol `backoffice`: financieel + administratief beheer, géén organisatie-instellingen of gebruikersbeheer
- `adviseur` en `installateur` zien alleen eigen werk
- Centrale permissie-helpers consequent toegepast (vervangt verspreide rol-checks)
- Sidebar per rol minimaliseren

### Database-migratie
```sql
-- Enum-waarde toevoegen (al aanwezig in is_admin_tier, dus enum bestaat mogelijk al — controleren in migratie)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'backoffice';
```
Daarna RLS-policies aanscherpen op modules waar adviseur/installateur nu te veel zien:
- `leads`: adviseur ziet alleen `owner_user_id = auth.uid()`
- `offertes`: adviseur ziet alleen eigen offertes
- `schouwen`: adviseur ziet alleen eigen schouwen
- `installaties`: installateur ziet alleen toegewezen installaties
- `financiele_documenten`: alleen `is_admin_tier()` (incl. backoffice) — adviseur/installateur géén toegang
- `partners` (instellingen) + `users` (gebruikersbeheer): alleen `is_partner_admin_or_higher()` — backoffice géén toegang

### Frontend
- `src/lib/permissions.ts` is al aanwezig en correct → in alle pagina's/componenten consequent gebruiken i.p.v. losse `rol === 'xxx'` checks
- `AppSidebar.tsx`: menu-items conditioneel op rol:
  - `backoffice`: Dashboard, Leads, Offertes, Opdrachten, Financieel, Klanten, Leveranciers, Producten, Helpdesk
  - `adviseur`: Dashboard, eigen Leads, eigen Offertes, eigen Schouwen, Planning, Klanten
  - `installateur`: Dashboard, eigen Installaties, Planning
- `ProtectedRoute` op routes: financieel/leveranciers/producten met `allowedRoles={ADMIN_TIER}`, instellingen/gebruikers met `PARTNER_ADMIN_TIER`
- `ROL_LABEL` toevoegen aan rol-selectors in `UitnodigDialog` + `PermissieToggles` zodat backoffice uitnodigbaar is

### Bestanden (deel B)
| Bestand | Actie |
|---|---|
| `supabase/migrations/…_backoffice_rol_en_rls.sql` | **Nieuw** — enum-waarde + RLS-policies per module |
| `src/components/AppSidebar.tsx` | Menu per rol via `permissions.ts` helpers |
| `src/components/ProtectedRoute.tsx` | Verifiëren dat het met nieuwe helpers werkt |
| `src/App.tsx` | Routes met `allowedRoles` op financieel/instellingen/gebruikers |
| `src/components/gebruikers/UitnodigDialog.tsx` | `backoffice` als optie + label uit `ROL_LABEL` |
| `src/components/gebruikers/PermissieToggles.tsx` | `backoffice` toevoegen |
| `src/pages/Leads.tsx`, `src/pages/Offertes.tsx`, `src/pages/Schouwen.tsx`, `src/pages/Installaties.tsx` | Vervangen losse rol-checks door `canSeeAllLeads()` etc. |

## Volgorde van uitvoering
1. **Deel A** eerst (klein, 2 bestanden) — sluit voorschotfacturen volledig af
2. **Deel B** daarna:
   - Database-migratie (enum + RLS)
   - `AppSidebar` + `ProtectedRoute` + routes
   - Rol-checks in pages vervangen door `permissions.ts` helpers
   - `UitnodigDialog` + `PermissieToggles` uitbreiden

## Niet wijzigen
- Bestaande factuur/PDF/email-flow voor voorschotten (al klaar)
- `permissions.ts` zelf (al correct)
- Mollie-integratie blijft uitgesteld

## Resultaat
- Voorschot- en eindafrekeningfacturen ook zonder offerte aanmaakbaar met juiste nummering (`VS-YYYY-XXXX`)
- Rol `backoffice` operationeel met administratieve toegang zonder organisatie-rechten
- Adviseur/installateur zien strikt eigen werk (RLS + UI)
- Sidebar toont per rol alleen wat relevant is
