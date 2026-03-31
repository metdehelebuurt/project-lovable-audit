

# Plan: Volledige Abonnementen Module

## Overzicht

Een compleet commercieel abonnementensysteem met: admin planbeheer, feature gating, facturering, affiliate-integratie, kortingenbeheer, partner self-service, en revenue analytics. Het bestaande `abonnementen`-tabel wordt vervangen door een nieuw genormaliseerd datamodel.

---

## Database: Nieuw datamodel (6 nieuwe tabellen + 1 aangepast)

### Tabel 1: `abonnement_plannen` (admin-configureerbare tiers)
| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| naam | text | Starter / Professional / Enterprise |
| slug | text unique | starter / professional / enterprise |
| beschrijving | text | Publieke beschrijving |
| maand_prijs | numeric | Maandprijs excl. BTW |
| jaar_prijs | numeric | Jaarprijs (met korting) |
| max_leads | int | Limiet leads (null = onbeperkt) |
| max_offertes | int | Limiet offertes |
| max_gebruikers | int | Limiet gebruikers |
| max_adviseurs | int | Limiet adviseurs |
| max_installateurs | int | Limiet installateurs |
| modules | jsonb | Array van beschikbare modules |
| features | jsonb | Array van specifieke features |
| voorwaarden | text | Abonnementsvoorwaarden |
| actief | boolean | Beschikbaar voor nieuwe abonnementen |
| volgorde | int | Sorteervolgorde op prijspagina |
| created_at / updated_at | timestamptz | |

### Tabel 2: Bestaande `abonnementen` — uitbreiden
Extra kolommen toevoegen:
- `plan_id` (uuid → abonnement_plannen)
- `interval` (text: 'maandelijks' / 'jaarlijks')
- `volgende_factuur_datum` (date)
- `opzeg_datum` (date, null = niet opgezegd)
- `opzegtermijn_dagen` (int, default 30)
- `notities` (text)
- `korting_percentage` (numeric)
- `korting_vast_bedrag` (numeric)
- `korting_reden` (text)
- `gratis_maanden` (int, default 0)

### Tabel 3: `facturen`
| Kolom | Type |
|-------|------|
| id | uuid PK |
| abonnement_id | uuid |
| partner_id | uuid |
| factuurnummer | text unique |
| bedrag_excl_btw | numeric |
| btw_bedrag | numeric |
| totaal_bedrag | numeric |
| korting_bedrag | numeric |
| periode_start | date |
| periode_eind | date |
| status | text (concept/verstuurd/betaald/vervallen) |
| betaald_op | timestamptz |
| betaald_via | text |
| pdf_url | text |
| notities | text |
| created_at | timestamptz |

### Tabel 4: `abonnement_wijzigingen` (audit log)
| Kolom | Type |
|-------|------|
| id | uuid PK |
| abonnement_id | uuid |
| partner_id | uuid |
| user_id | uuid |
| type | text (aangemaakt/upgrade/downgrade/opgezegd/verlengd/korting/betaling) |
| van_plan_id | uuid |
| naar_plan_id | uuid |
| details | jsonb |
| created_at | timestamptz |

### Tabel 5: `affiliate_commissies`
| Kolom | Type |
|-------|------|
| id | uuid PK |
| affiliate_id | uuid |
| partner_id | uuid |
| abonnement_id | uuid |
| type | text (eenmalig/recurring) |
| bedrag | numeric |
| percentage | numeric |
| status | text (gepland/uitbetaald/geannuleerd) |
| factuur_id | uuid |
| created_at | timestamptz |

### Tabel 6: `abonnement_notificaties_config`
Eenmalige configuratietabel voor voorwaarschuwingen (bijv. 7 dagen, 3 dagen, 1 dag voor verloop).

### RLS-beleid
- **abonnement_plannen**: SELECT voor iedereen (authenticated), CRUD voor superadmin
- **abonnementen**: SELECT voor eigen partner, UPDATE voor superadmin + partner_admin (beperkt), CRUD voor superadmin
- **facturen**: SELECT eigen partner, CRUD superadmin, UPDATE (betaling registreren) superadmin
- **abonnement_wijzigingen**: SELECT eigen partner + superadmin, INSERT superadmin
- **affiliate_commissies**: SELECT eigen affiliate + superadmin, CRUD superadmin

---

## Pagina's & Componenten

### 1. Admin: Abonnement Beheer (`/admin/abonnementen`) — superadmin only

**Tab 1: Plannen Configureren**
- CRUD voor abonnement_plannen
- Per plan: naam, prijzen, limieten, modules (checkboxes), features (checkboxes), voorwaarden (rich text)
- Module-lijst: Leads, Offertes, Schouwen, Opdrachten, Installaties, Planning, Analytics, Documenten, Energieadvies, Tools, Webtools, Thuisbatterij Selector
- Drag & drop sortering

**Tab 2: Abonnementen Overzicht**
- Tabel met alle partner-abonnementen
- Filters: status, plan, verloopt binnenkort
- Acties: plan wijzigen, korting toepassen, trial verlengen, opzeggen, notities
- Waarschuwingslijst: trials die bijna verlopen, vervallen facturen, langdurige trials

**Tab 3: Facturering**
- Overzicht alle facturen met status-filters
- Handmatig betaling registreren
- Factuur genereren (handmatig voor huidige periode)
- Factuur PDF downloaden
- Betalingsherinneringen versturen

**Tab 4: Kortingen & Affiliates**
- Integratie met bestaand affiliate-systeem
- Commissie-overzicht per affiliate
- Individuele commissie-percentages instellen
- Kortingscodes koppelen aan plannen
- Gratis maanden bij jaarabonnement instellen

**Tab 5: Revenue Analytics**
- MRR / ARR berekening
- Churn rate
- Trial → betaald conversieratio
- Omzet per plan
- Activiteitenlog / timeline

### 2. Partner: Mijn Abonnement (`/instellingen` → tab "Abonnement")

- Huidig plan met details (naam, prijs, limieten)
- Gebruiksoverzicht: X/Y leads gebruikt, X/Y gebruikers, etc.
- Upgrade-knop (toont beschikbare plannen met vergelijking)
- Factuurhistorie met PDF-download
- Opzeg-functie (self-service, met opzegtermijn-waarschuwing)
- Verloopdatum en volgende factuur

### 3. Feature Gating Systeem

**Nieuw: `useSubscriptionLimits` hook**
- Haalt actief abonnement + plan op
- Biedt functies: `canAccess(module)`, `isWithinLimit(type, count)`, `getPlanLimits()`
- Gebruikt in sidebar (modules verbergen), en bij CRUD-acties (limiet-check)

**Nieuw: `FeatureGate` wrapper component**
- Wrapped rond modules die beperkt zijn
- Toont upgrade-prompt als module niet beschikbaar is

### 4. Notificatie-integratie

- In-app notificaties voor admin: nieuwe aanmelding, opzegging, betaling mislukt
- In-app notificaties voor partner: factuur verstuurd, plan gewijzigd, trial verloopt
- Voorwaarschuwingen: 7 en 3 dagen voor trial/abonnement verloop

---

## Edge Functions

### `subscription-invoice-generate`
- Genereert PDF-factuur voor een abonnement
- Slaat op in storage bucket `facturen`
- Wordt aangeroepen door admin of door scheduled job

### `subscription-notifications`
- Scheduled (via pg_cron): dagelijks check op verlopen trials, komende facturen, voorwaarschuwingen
- Creëert notificaties + verstuurt e-mails

---

## Bestanden (nieuw en gewijzigd)

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | 4 nieuwe tabellen + uitbreiding abonnementen |
| `src/pages/AdminAbonnementen.tsx` | Nieuw: volledig admin dashboard (5 tabs) |
| `src/pages/Instellingen.tsx` | Nieuwe tab "Abonnement" voor partners |
| `src/hooks/useSubscriptionLimits.ts` | Nieuw: feature gating hook |
| `src/components/abonnementen/PlanConfigurator.tsx` | Nieuw: plan CRUD |
| `src/components/abonnementen/AbonnementOverzicht.tsx` | Nieuw: admin overzicht |
| `src/components/abonnementen/FactuurBeheer.tsx` | Nieuw: factuur management |
| `src/components/abonnementen/RevenueAnalytics.tsx` | Nieuw: MRR/ARR/churn |
| `src/components/abonnementen/PartnerAbonnement.tsx` | Nieuw: partner self-service |
| `src/components/abonnementen/PlanVergelijking.tsx` | Nieuw: upgrade vergelijking |
| `src/components/abonnementen/FeatureGate.tsx` | Nieuw: gating wrapper |
| `src/components/AppSidebar.tsx` | Feature gating + "Abonnementen" menu-item voor superadmin |
| `src/App.tsx` | Route `/admin/abonnementen` toevoegen |
| `supabase/functions/subscription-invoice-generate/index.ts` | Nieuw: factuur PDF |
| `supabase/functions/subscription-notifications/index.ts` | Nieuw: dagelijkse checks |
| Storage bucket `facturen` | Nieuw: voor factuur-PDFs |

---

## Bouwvolgorde

1. Database migratie (alle tabellen + RLS)
2. Plan configurator (admin UI)
3. Abonnementen overzicht + wijzigingen (admin)
4. Partner self-service (instellingen tab)
5. Facturering (generatie + beheer + PDF)
6. Feature gating (hook + component + sidebar integratie)
7. Kortingen & affiliate commissie-integratie
8. Revenue analytics
9. Notificaties & scheduled jobs
10. Grondige test van alle functies

