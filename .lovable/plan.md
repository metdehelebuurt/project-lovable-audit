

## Plan: Affiliate/Wederverkoper rol met kortingscodes en abonnementensysteem

### Overzicht

Er wordt een volledig affiliate-systeem gebouwd met een nieuwe `affiliate` rol, inclusief:
- Eigen dashboard met aangebrachte klanten en commissie-overzicht
- Kortingscodes aanmaken met configureerbare kortingen
- Affiliate links genereren
- Superadmin-module voor maximums en instellingen
- Werkend abonnementensysteem gekoppeld aan affiliate tracking

---

### 1. Database migratie

**Enum uitbreiden:**
- Voeg `affiliate` toe aan `app_role` enum

**Nieuwe tabellen:**

**`affiliate_links`** — Unieke referral links per affiliate
| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| user_id | uuid NOT NULL | Affiliate user |
| code | text UNIQUE NOT NULL | Unieke slug (bijv. "jan-solar") |
| url | text generated | Volledige URL |
| clicks | integer DEFAULT 0 | Aantal kliks |
| actief | boolean DEFAULT true | |
| created_at | timestamptz | |

**`kortingscodes`** — Kortingscodes aangemaakt door affiliates
| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| affiliate_id | uuid NOT NULL | Aanmaker |
| code | text UNIQUE NOT NULL | Kortingscode (bijv. "SOLAR20") |
| korting_type | text NOT NULL | 'percentage' of 'vast_bedrag' |
| korting_waarde | numeric NOT NULL | Percentage of euro's |
| max_gebruik | integer | Max aantal keer te gebruiken |
| aantal_gebruikt | integer DEFAULT 0 | |
| geldig_tot | date | Verloopdatum |
| actief | boolean DEFAULT true | |
| created_at | timestamptz | |

**`affiliate_referrals`** — Tracking van aangebrachte klanten
| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| affiliate_id | uuid NOT NULL | |
| partner_id | uuid | Aangebrachte partner |
| kortingscode_id | uuid | Gebruikte code |
| affiliate_link_id | uuid | Gebruikte link |
| status | text DEFAULT 'actief' | actief/verlopen/opgezegd |
| commissie_percentage | numeric | Commissie voor deze referral |
| commissie_verdiend | numeric DEFAULT 0 | Totaal verdiend |
| created_at | timestamptz | |

**`affiliate_instellingen`** — Superadmin configuratie (singleton)
| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| max_korting_percentage | numeric DEFAULT 25 | Max korting die affiliate mag instellen |
| max_korting_vast_bedrag | numeric DEFAULT 50 | Max vast bedrag korting |
| standaard_commissie_percentage | numeric DEFAULT 10 | Default commissie |
| max_commissie_percentage | numeric DEFAULT 30 | Plafond commissie |
| min_abonnement_maanden | integer DEFAULT 3 | Min looptijd voor commissie |
| cookie_dagen | integer DEFAULT 30 | Tracking cookie duur |
| updated_at | timestamptz | |

**`abonnementen`** — Werkend abonnementensysteem voor partners
| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| partner_id | uuid UNIQUE NOT NULL | |
| plan | text NOT NULL | starter/professional/enterprise |
| status | text DEFAULT 'actief' | actief/verlopen/geannuleerd |
| maand_bedrag | numeric NOT NULL | |
| start_datum | date NOT NULL | |
| verloop_datum | date | |
| affiliate_referral_id | uuid | Link naar referral |
| kortingscode_id | uuid | Toegepaste korting |
| korting_actief_tot | date | Tot wanneer korting geldt |
| created_at / updated_at | timestamptz | |

**RLS policies:** Affiliates zien alleen eigen links, codes en referrals. Superadmin ziet alles. Partner ziet eigen abonnement.

---

### 2. Signup flow aanpassen

**`src/pages/Signup.tsx`** — Uitbreiden:
- URL parameter `?ref=CODE` uitlezen en opslaan
- Bij signup: ref-code meesturen naar trial-signup edge function

**`supabase/functions/trial-signup/index.ts`** — Uitbreiden:
- Als `ref` parameter aanwezig: affiliate_link opzoeken, click tellen, referral aanmaken
- Als `kortingscode` aanwezig: valideren tegen maximums en toepassen op abonnement
- Abonnement-record aanmaken bij signup

---

### 3. Nieuwe pagina's en componenten

**`src/pages/Affiliates.tsx`** — Affiliate dashboard (voor affiliate rol):
- Overzicht aangebrachte klanten met status (actief/verlopen)
- Commissie-overzicht (verdiend deze maand, totaal)
- Affiliate links beheren (aanmaken, kopiëren, clicks zien)
- Kortingscodes beheren (aanmaken met validatie tegen max, gebruik tellen)
- Statistieken: conversieratio, actieve klanten

**`src/pages/AffiliateBeheer.tsx`** — Superadmin module:
- Alle affiliates overzicht met prestaties
- Instellingen bewerken (max korting, commissie plafonds, cookie duur)
- Individuele commissie-percentages per affiliate aanpassen
- Uitbetalingsoverzicht

---

### 4. Routing en navigatie

**`src/App.tsx`:**
- Route `/affiliates` voor affiliate dashboard (rol: affiliate)
- Route `/affiliate-beheer` voor superadmin module (rol: superadmin)

**`src/components/AppSidebar.tsx`:**
- Affiliate rol krijgt: Dashboard, Mijn Klanten (/affiliates), Instellingen
- Superadmin krijgt extra: "Affiliate Beheer" menu-item

**`src/components/ProtectedRoute.tsx`:**
- `affiliate` toevoegen aan bestaande allowedRoles waar nodig

---

### 5. Edge function updates

**`supabase/functions/user-management/index.ts`:**
- `affiliate` rol toevoegen als aanmaakbaar door superadmin
- Affiliates worden NIET gekoppeld aan een partner_id (ze zijn onafhankelijk)

---

### 6. Abonnementensysteem

Het abonnementensysteem wordt functioneel via de `abonnementen` tabel:
- Bij trial-signup wordt automatisch een abonnement-record aangemaakt (plan: "trial", 30 dagen)
- Superadmin kan abonnementen beheren via Partners pagina (extra tab/kolom)
- Affiliate kortingscodes worden bij signup gevalideerd en toegepast op het abonnement
- Dashboard toont abonnementsstatus voor partner_admins

