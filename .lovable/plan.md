

# Plan — Rolherstructurering + nieuwe rol "Backoffice" + lekdichte toegang

## A. Analyse van de huidige situatie

Database-rollen (`app_role` enum):
`superadmin`, `partner_admin`, `partner_staff`, `adviseur`, `installateur`, `consument`, `affiliate`

### Wat er momenteel mis gaat (te ruime toegang)

| Module | Huidige toegang | Probleem |
|---|---|---|
| **Adviseurs-overzicht** (`/adviseurs`) | superadmin, partner_admin, partner_staff | Alleen managers/HR mogen prestaties van collega's zien — staff is te breed |
| **Klanten** (`/klanten`) | + adviseur | Adviseur ziet ALLE klanten van de partner i.p.v. alleen eigen klanten |
| **Leads** (`/leads`) | + adviseur | Idem — adviseur kan andermans leads zien (alleen filter "mijn leads" in UI, geen DB-scope) |
| **Financieel** (`/financieel/*`) | superadmin, partner_admin, partner_staff, **adviseur** | ⚠️ KRITIEK: adviseur ziet alle facturen, BTW, openstaande posten, omzet van de hele partner |
| **Documenten** (`/documenten`) | superadmin, partner_admin, partner_staff | Geen uitvoerend personeel, OK — maar adviseur/installateur hebben soms documenten nodig (datasheets, garanties) |
| **Leveranciers** (`/leveranciers`) | superadmin, partner_admin, partner_staff | OK — maar onduidelijk wie inkoopfacturen doet |
| **Producten** (`/producten`) | + installateur | Installateur ziet ALLE prijzen + marges. Mag specs en voorraad zien, niet inkoopprijs |
| **Opdrachten** (`/opdrachten`) | + installateur | Installateur ziet financiële regels + kortingen op opdrachten van anderen |
| **Schouwen** (`/schouwen`) | iedereen incl. installateur, consument | Installateur hoort alleen schouwen te zien die aan zijn opdracht gekoppeld zijn |
| **Berichten** (`/berichten`) | partner_admin, partner_staff, adviseur, consument | Installateur uitgesloten — terwijl die wel met de klant communiceert |
| **Instellingen** | partner_admin tabs gated op UI | OK — maar `partner_staff` ziet geen admin-tabs dus niets |
| **Helpdesk** | superadmin, partner_admin, partner_staff, adviseur, installateur | Iedereen ziet alle tickets — installateur hoort alleen eigen toegewezen tickets te zien |

### Conclusies

1. **Adviseur** heeft toegang tot omzet/BTW/inkoop van de hele partner — moet weg.
2. **Installateur** ziet productprijzen, opdrachten van collega's en alle schouwen — te breed.
3. Er ontbreekt een **backoffice**-rol voor mensen die wel de hele administratie (facturatie, leveranciers, documenten, klanten) doen, maar geen technisch werk uitvoeren en niet de hele organisatie mogen beheren (dat is `partner_admin`).
4. `partner_staff` is een vage allesomvattende rol — wordt nu gebruikt als "kantoormedewerker" maar overlapt met admin-rechten.

---

## B. Voorgestelde nieuwe rolverdeling

### Nieuwe rol: **`backoffice`**
> Administratief medewerker: doet facturatie, leveranciers, documenten, klantbeheer, planning. Geen rolbeheer, geen abonnement, geen huisstijl, geen prijsstrategie.

### Hernieuwde rol-omschrijvingen

| Rol | Scope | Hoofd­bevoegdheden |
|---|---|---|
| **superadmin** | Platform | Alles |
| **partner_admin** | Volledige organisatie | Beheer + alle operationele modules + abonnement + huisstijl + gebruikers |
| **backoffice** *(nieuw)* | Financieel + administratie | Klanten, leads (alle), offertes (alle), opdrachten, facturen, leveranciers, documenten, planning, helpdesk-tickets toewijzen. **GEEN** gebruikersbeheer, geen abonnement, geen huisstijl, geen rolwijziging |
| **partner_staff** | Operationeel breed (binnenstem) | Leads (alle), klanten (alle), offertes, schouwen, opdrachten, planning, helpdesk. **GEEN** financieel, geen leveranciers, geen documenten-beheer |
| **adviseur** | Eigen werk (commercieel) | **Eigen** leads + **eigen** klanten + **eigen** offertes + schouwen, planning (eigen agenda), producten (zonder inkoopprijs), helpdesk (eigen tickets), berichten met klanten. **GEEN** financieel, geen analytics, geen documenten, geen leveranciers, geen adviseurs-overzicht |
| **installateur** | Eigen opdrachten | Eigen opdrachten + bijbehorende schouwen + planning (eigen) + producten (specs only, geen prijzen) + helpdesk (eigen tickets) + berichten met klant. **GEEN** leads, geen klanten-overzicht, geen offertes, geen financieel, geen tools |
| **affiliate** | Eigen referrals | Affiliate-dashboard, eigen offertes (read-only), instellingen (eigen profiel) |
| **consument** | Eigen dossier | Eigen offertes, eigen schouwen, eigen planning, eigen berichten |

---

## C. Nieuwe toegangsmatrix (samenvatting)

| Module | super | partner_admin | **backoffice** | partner_staff | adviseur | installateur | affiliate | consument |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Partners | ✅ | — | — | — | — | — | — | — |
| Adviseurs-overzicht | ✅ | ✅ | — | — | — | — | — | — |
| Gebruikers | ✅ | ✅ | — | — | — | — | — | — |
| Leads | ✅ | ✅ | ✅ | ✅ | 🔒 eigen | — | — | — |
| Klanten | ✅ | ✅ | ✅ | ✅ | 🔒 eigen | — | — | — |
| Producten | ✅ | ✅ | ✅ (incl. inkoop) | ✅ | 👁 zonder inkoopprijs | 👁 specs only | — | — |
| Schouwen | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 gekoppeld | — | 🔒 eigen |
| Offertes | ✅ | ✅ | ✅ | ✅ | 🔒 eigen | — | 👁 referrals | 🔒 eigen |
| Opdrachten | ✅ | ✅ | ✅ | ✅ | 🔒 eigen | 🔒 toegewezen | — | — |
| Installaties | ✅ | ✅ | ✅ | ✅ | — | 🔒 eigen | — | — |
| Planning | ✅ | ✅ | ✅ | ✅ | 🔒 eigen agenda | 🔒 eigen agenda | — | 🔒 eigen |
| **Financieel** | ✅ | ✅ | **✅** | — | — | — | — | — |
| Leveranciers | ✅ | ✅ | ✅ | — | — | — | — | — |
| Documenten | ✅ | ✅ | ✅ | ✅ | 👁 lezen | 👁 lezen | — | — |
| Analytics | ✅ | ✅ | ✅ | — | — | — | — | — |
| Berichten | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Energieadvies/Tools | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| Helpdesk-tickets | ✅ alle | ✅ alle | ✅ alle | ✅ alle | 🔒 eigen | 🔒 eigen | — | — |
| Helpdesk-kennisbank | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Instellingen (admin tabs) | ✅ | ✅ | — | — | — | — | — | — |
| Affiliate-dashboard | — | — | — | — | — | — | ✅ | — |

🔒 = data-scope-restrictie (alleen eigen records via DB/RLS-filter)
👁 = read-only of beperkt zicht

---

## D. Implementatieplan

### Stap 1 — Database

Migratie:
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'backoffice' BEFORE 'partner_staff';
```

RLS-aanpassingen (nieuwe migratie):
- `financiele_documenten`, `inkoopfactuur_*`, `pakbonnen`, `btw_aangiften`: SELECT/UPDATE alleen voor `superadmin`, `partner_admin`, `backoffice`
- `leveranciers`: idem
- `producten`: kolom `inkoopprijs` gemaskeerd via een view `producten_publiek` voor adviseur/installateur (RLS staat al op `partner_id` — view hide gevoelige kolommen)
- `leads`/`klanten`/`offertes`: nieuwe RLS-clausule "adviseur ziet alleen waar `owner_user_id` of `adviseur_id = auth.uid()`" (toevoegen naast bestaande partner-scope, niet vervangen)
- `opdrachten`: installateur ziet alleen waar `installateur_id = auth.uid()`
- `schouwen`: installateur alleen waar gekoppeld via `opdrachten.schouw_id`
- `helpdesk_tickets`: adviseur/installateur alleen waar `toegewezen_aan = auth.uid()` of `gemaakt_door = auth.uid()`

### Stap 2 — `src/App.tsx` route-rechten

Volledige herziening volgens matrix. Belangrijke wijzigingen:
- Verwijder `adviseur` uit `/financieel/*`, `/documenten`
- Verwijder `installateur` uit `/producten` overzicht (alleen detail) en uit `/opdrachten` lijst (krijgt eigen "Mijn opdrachten" via filter)
- Voeg `backoffice` toe aan: leads, klanten, offertes, opdrachten, installaties, planning, financieel, leveranciers, documenten, analytics, berichten, helpdesk
- Voeg `partner_staff` toe aan analytics; verwijder uit financieel/leveranciers/documenten-beheer
- Splits `/installaties` toegang: installateur leest, alleen `partner_admin`/`backoffice` mag aanmaken/wijzigen

### Stap 3 — `src/components/AppSidebar.tsx`

Herstructurering met nieuwe rol-aware logica + extra label "Backoffice" voor financiële groep. Verberg menu-items volgens de matrix. Adviseur/installateur krijgen een minimale, taakgerichte sidebar.

### Stap 4 — Helper voor centrale rol-checks

Nieuw bestand `src/lib/permissions.ts` met functies:
```ts
canAccessFinance(rol), canSeeAllLeads(rol), canManageUsers(rol),
canSeeProductCost(rol), canCreateSchouw(rol), isOperational(rol),
isAdminTier(rol)  // superadmin | partner_admin | backoffice
```
Vervang verspreide `profile.rol === "..."`-checks door deze helpers (in 19 bestanden gevonden).

### Stap 5 — Edge function `user-management`

- Voeg `backoffice` toe aan `allowedRolesForPartnerAdmin` en `allowedRolesForSuperadmin`
- Bij `invite_user`: zelfde uitbreiding
- Voeg uitleg toe in `UitnodigDialog` rolkeuze

### Stap 6 — UI-componenten

- `UitnodigDialog`: rol-dropdown krijgt "Backoffice (financieel & administratie)"
- `GebruikerDetail` rol-dropdown: idem
- `Gebruikers.tsx` tabs: nieuwe tab "Backoffice" naast Adviseurs/Installateurs/Beheerders
- `PartnerAbonnement.tsx`: licentie-telling neemt backoffice mee als "administratief gebruiker"
- `AuthContext` types: `AppRole` regenereert automatisch via Supabase types — geen handmatige aanpassing nodig
- `ROL_LABELS` in `GebruikerDetail.tsx`: voeg `backoffice: "Backoffice"`

### Stap 7 — Data-scoping (cruciaal voor adviseur/installateur)

Aanpassing in queries (niet alleen RLS):
- `Leads.tsx`: voor adviseur → default filter `owner_user_id = me.id`, geen "alle leads"-toggle
- `Klanten.tsx`: voor adviseur → join via leads/offertes waar adviseur eigenaar is
- `Offertes.tsx`: voor adviseur → filter `adviseur_id = me.id` (al deels aanwezig, hard maken)
- `Opdrachten.tsx`: voor installateur → filter `installateur_id = me.id`
- `Schouwen.tsx`: voor installateur → enkel via `opdrachten.schouw_id`-join
- `Helpdesk TicketsOverzicht`: filter op `toegewezen_aan = me.id` voor adviseur/installateur
- `Producten.tsx`: voor adviseur/installateur → query gebruikt nieuwe view `producten_publiek` (zonder inkoopprijs)

### Stap 8 — Tests / verificatie

Manuele testmatrix per rol — checklist van 12 routes per rol om te verifiëren dat:
- Sidebar toont alleen toegestane items
- Directe URL-toegang tot verboden pagina geeft redirect
- Data-queries retourneren alleen scope-eigen records

---

## E. Bestanden

| Bestand | Actie |
|---|---|
| `supabase/migrations/…_role_backoffice_en_scoping.sql` | Nieuw — enum-uitbreiding + RLS-aanpassingen + product-view |
| `src/App.tsx` | Routes herzien volgens matrix |
| `src/components/AppSidebar.tsx` | Sidebar-logica herschrijven met nieuwe matrix |
| `src/lib/permissions.ts` | **Nieuw** — centrale rol-helpers |
| `src/pages/Leads.tsx`, `Klanten.tsx`, `Offertes.tsx`, `Opdrachten.tsx`, `Schouwen.tsx`, `Producten.tsx` | Data-scope filters voor adviseur/installateur |
| `src/pages/helpdesk/TicketsOverzicht.tsx` | Eigen tickets filter voor adviseur/installateur |
| `src/pages/Financieel.tsx` + sub-componenten | Verwijder adviseur uit access checks |
| `src/components/gebruikers/UitnodigDialog.tsx` | Rol "Backoffice" toevoegen |
| `src/pages/GebruikerDetail.tsx` | Rol-labels + dropdown uitbreiden |
| `src/pages/Gebruikers.tsx` | Tab "Backoffice" toevoegen |
| `supabase/functions/user-management/index.ts` | `backoffice` in allowed roles |
| `src/components/abonnementen/PartnerAbonnement.tsx` | Backoffice-telling in licenties |
| `mem://auth/roles` | Memory bijwerken naar 8 rollen |

## F. Niet wijzigen
- `superadmin`, `affiliate`, `consument` toegangsregels (al correct)
- Bestaande RLS-helper-functies (`is_superadmin`, `get_user_role`, `get_user_partner_id`)
- AuthContext / ProtectedRoute (mechanisme blijft, alleen lijsten veranderen)

## G. Resultaat

- Adviseur en installateur zien **alleen eigen werk** — geen omzet, BTW, andermans deals
- Nieuwe **backoffice**-rol vult het gat tussen "uitvoerend" en "volledig admin" — perfect voor financiële medewerkers
- Centrale `permissions.ts` voorkomt dat rol-checks over 19 bestanden uit elkaar lopen
- RLS afgedwongen op DB-niveau — geen data-lek meer ook al staat de UI per ongeluk open
- Sidebar per rol minimaal en taakgericht in plaats van een dump van alle modules

