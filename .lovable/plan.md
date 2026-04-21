

# Plan — Volwassen gebruikersbeheer + persoonlijke Gmail/Outlook per gebruiker

## A. Probleemanalyse (huidige staat)

| # | Probleem |
|---|---|
| 1 | "Nieuwe gebruiker" zit verstopt in 1 generieke `Gebruikers`-pagina; niet duidelijk dat partners adviseurs/installateurs kunnen aanmaken |
| 2 | Form vraagt om handmatig wachtwoord; geen uitnodig-via-mail flow → onveilig en onhandig |
| 3 | Geen klikbaar gebruikersprofiel met statistieken, audit, sessies |
| 4 | `email_accounts` is gekoppeld op **`partner_id` + `provider`** (uniek). 1 inbox per organisatie → niemand kan via eigen Gmail/Outlook mailen |
| 5 | `users`-tabel mist: functie, avatar, last_login_at, mfa_enabled, taal, timezone, is_uitgenodigd, uitnodiging_token, opmerking |
| 6 | Geen audit-trail (wie wijzigde wat, wanneer); geen sessie-overzicht; geen vakantie/afwezigheid |

## B. Nieuwe architectuur — Persoonlijke e-mailkoppeling

**Database-aanpassing (1 migratie):**
- `email_accounts.partner_id` blijft, maar **uniek-constraint wijzigt** van `(partner_id, provider)` → `(user_id, provider)` zodat elke gebruiker eigen account heeft
- Nieuwe kolom `email_accounts.is_default_voor_partner boolean default false` — partner_admin kan 1 account markeren als fallback voor systeemmails
- `email_berichten`: nieuwe kolom `email_account_id` is al aanwezig — query's filteren straks op `account.user_id = current user`

**OAuth-flow leekproof maken:**
- Knop **"Koppel mijn Gmail/Outlook"** komt op nieuwe pagina `/profiel` (eigen profiel) én op gebruikersdetail (alleen voor jezelf)
- 3-stappen wizard met preview: (1) "Selecteer provider" → (2) Google/MS popup → (3) "✓ Gekoppeld als naam@…"
- Als koppeling mislukt: duidelijke uitleg + auto-detectie redirect-URI mismatch (al aanwezig, uitbreiden met "Probleem oplossen"-knop die config opnieuw ophaalt)
- Bij offerte/factuur versturen: edge-functions kiezen automatisch het `email_account` van de huidige `verzonden_door_id`, met fallback naar partner-default of SMTP

## C. Verbeterde gebruikersbeheer-UX

### 1. `Gebruikers.tsx` herstructureren
- **Top-tabs**: "Alle / Adviseurs / Installateurs / Beheerders / Uitgenodigd / Inactief"
- Per kaart in plaats van rij optioneel via toggle (mobiel-vriendelijk)
- **"Nieuwe medewerker"-knop met dropdown**: kies type direct ("→ Nieuwe adviseur", "→ Nieuwe installateur", "→ Nieuwe beheerder", "→ Bestaand persoon uitnodigen via e-mail")
- Bulk-acties: meerdere selecteren → activeren/deactiveren/wijzig rol
- Avatar-kolom (eerste letter + kleur als fallback)
- Snelfilters: laatst actief (week/maand/nooit), MFA aan/uit, e-mail gekoppeld ja/nee

### 2. Klikbare gebruikersdetailpagina `/gebruikers/:id`
2+1 grid (zelfde patroon als `KlantDetail`):

**Linker 2 kolommen — tabs:**
- **Profiel**: avatar, naam, e-mail, telefoon, functie, taal, timezone, opmerking → bewerkbaar
- **Rol & rechten**: huidige rol + dropdown om aan te passen (audit-trail loggen), partner-koppeling, status (actief/inactief/geschorst)
- **Statistieken**: leads/schouwen/offertes/omzet/conversie (hergebruik logica uit `Adviseurs.tsx`) met periode-selector
- **Activiteit**: laatste 50 acties uit nieuwe `audit_log`-tabel (login, offerte aangemaakt, klant gewijzigd…)
- **Sessies**: actieve sessies via `auth.sessions` (via edge function); knop "Forceer uitloggen"
- **E-mailkoppeling**: status van persoonlijke OAuth-koppeling + sync-stats

**Rechter kolom — quick-info:**
- Status-badges, laatste login, MFA-status, aantal openstaande tickets/taken
- Knoppen: "Wachtwoord resetten", "Magic-link sturen", "Verstuur welkomstmail opnieuw", "Deactiveren", "Verwijderen"

## D. 8 nieuwe SAAS-functies

| # | Functie | Wat het doet |
|---|---|---|
| **1** | **Uitnodig-via-e-mail flow** | Beheerder vult enkel naam+email+rol in → systeem stuurt magic-link uitnodiging (24u geldig). Ontvanger klikt → kiest eigen wachtwoord → MFA-setup-prompt → klaar. Geen handmatig wachtwoord delen meer. |
| **2** | **Audit-log per gebruiker** | Nieuwe tabel `audit_log` (user_id, actor_id, partner_id, actie, entity_type, entity_id, oude_waarde, nieuwe_waarde, ip, user_agent, ts). Trigger op `users`, `offertes`, `klanten`, `leads`. Tijdlijn op detailpagina. |
| **3** | **Verlof- & afwezigheidsbeheer** | Tabel `gebruiker_afwezigheid` (van/tot, reden, vervanger). Bij toewijzing van leads/offertes/tickets → waarschuwing "X is afwezig tot Y, kies vervanger Z". Auto-doorzetten naar vervanger optioneel. |
| **4** | **MFA verplicht per rol** | Partner-admin kan per rol verplichten (bv. "alle beheerders moeten 2FA aan hebben"). Niet-compliant gebruikers zien blokpagina bij login. Status zichtbaar in lijst (groen/rood badge). |
| **5** | **Per-gebruiker e-mailhandtekening + tone-of-voice** | Eigen HTML-handtekening (rich-text) per gebruiker, automatisch onderaan elke offerte/factuur/ticket-mail. Standaard tonen ook profielfoto/functie/telefoon. |
| **6** | **Activiteit-heatmap & inactiviteits-alert** | Profiel toont GitHub-style 90-dagen heatmap (login + acties). Auto-alert naar admin als gebruiker >30 dgn inactief is met optie "deactiveren of opnieuw uitnodigen". |
| **7** | **Permission-overrides per gebruiker** | Tabel `gebruiker_permissies` met fijnmazige toggles bovenop rol (bv. "deze adviseur mag wel kortingen >10% goedkeuren"). Standaard alle uit; rol bepaalt baseline. UI: schakelaar-lijst per gebruiker. |
| **8** | **Onboarding-checklist + welkomstwizard** | Nieuwe gebruiker krijgt bij eerste login een 5-staps wizard (profielfoto, telefoon, e-mail koppelen, MFA, eerste actie). Beheerder ziet voortgang per gebruiker (badge "Onboarding 60%"). |

## E. Database-migraties

```sql
-- Profielvelden
ALTER TABLE users ADD COLUMN functie text;
ALTER TABLE users ADD COLUMN avatar_url text;
ALTER TABLE users ADD COLUMN taal text DEFAULT 'nl';
ALTER TABLE users ADD COLUMN timezone text DEFAULT 'Europe/Amsterdam';
ALTER TABLE users ADD COLUMN last_login_at timestamptz;
ALTER TABLE users ADD COLUMN mfa_enabled boolean DEFAULT false;
ALTER TABLE users ADD COLUMN onboarding_voltooid boolean DEFAULT false;
ALTER TABLE users ADD COLUMN onboarding_stappen jsonb DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN handtekening_html text;
ALTER TABLE users ADD COLUMN opmerking text;
ALTER TABLE users ADD COLUMN uitgenodigd_op timestamptz;
ALTER TABLE users ADD COLUMN uitgenodigd_door uuid REFERENCES users(id);

-- E-mail per gebruiker
ALTER TABLE email_accounts DROP CONSTRAINT IF EXISTS email_accounts_partner_id_provider_key;
ALTER TABLE email_accounts ADD CONSTRAINT email_accounts_user_provider_key UNIQUE (user_id, provider);
ALTER TABLE email_accounts ADD COLUMN is_default_voor_partner boolean DEFAULT false;

-- Audit log
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid, actor_id uuid, target_user_id uuid,
  actie text NOT NULL, entity_type text, entity_id uuid,
  oude_waarde jsonb, nieuwe_waarde jsonb,
  ip inet, user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON audit_log (partner_id, created_at DESC);
CREATE INDEX ON audit_log (target_user_id, created_at DESC);

-- Afwezigheid
CREATE TABLE gebruiker_afwezigheid (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  van date NOT NULL, tot date NOT NULL,
  reden text, vervanger_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Permissie-overrides
CREATE TABLE gebruiker_permissies (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  permissies jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Auth-trigger om last_login_at te zetten
CREATE OR REPLACE FUNCTION sync_last_login() ...
```

Plus RLS-policies (alleen partner_admin/superadmin lezen audit van eigen partner; gebruiker leest eigen profiel + audit).

## F. Bestanden

| Bestand | Actie |
|---|---|
| `supabase/migrations/…_user_management_v2.sql` | **Nieuw** — alle DB-wijzigingen |
| `supabase/functions/user-management/index.ts` | Uitbreiden: `invite_user`, `resend_invite`, `force_logout`, `set_permissies`, `set_afwezigheid`, audit-logging in alle acties |
| `supabase/functions/user-invite-accept/index.ts` | **Nieuw** — magic-link landingsflow |
| `src/pages/Gebruikers.tsx` | Herschrijven met tabs, dropdown-knop, bulk-acties, snelfilters |
| `src/pages/GebruikerDetail.tsx` | **Nieuw** — 2+1 detailpagina met 6 tabs |
| `src/pages/Profiel.tsx` | **Nieuw** — eigen profiel + e-mailkoppeling-wizard |
| `src/components/gebruikers/GebruikerStats.tsx` | **Nieuw** — herbruikbare statsblok |
| `src/components/gebruikers/AuditTijdlijn.tsx` | **Nieuw** |
| `src/components/gebruikers/AfwezigheidEditor.tsx` | **Nieuw** |
| `src/components/gebruikers/PermissieToggles.tsx` | **Nieuw** |
| `src/components/gebruikers/EmailKoppelingWizard.tsx` | **Nieuw** — 3-staps OAuth |
| `src/components/gebruikers/HandtekeningEditor.tsx` | **Nieuw** — RichTextEditor |
| `src/components/gebruikers/OnboardingChecklist.tsx` | **Nieuw** |
| `src/components/gebruikers/UitnodigDialog.tsx` | **Nieuw** |
| `src/components/instellingen/EmailConfiguratie.tsx` | Aanpassen: scope wordt "partner-fallback SMTP", persoonlijke OAuth verhuist naar `/profiel` |
| `supabase/functions/send-offerte-email/index.ts` & `send-factuur-email`, `send-orderbevestiging-email` | Lookup `email_account` van `verzonden_door_id` → fallback partner default → fallback SMTP. Voeg user-handtekening toe. |
| `src/App.tsx` | Routes toevoegen: `/gebruikers/:id`, `/profiel`, `/uitnodiging/:token` |

## G. Niet wijzigen
- `Adviseurs.tsx` (blijft eigen overzichtspagina, krijgt link "→ Profiel")
- Bestaande RBAC-logica in `ProtectedRoute`

## Resultaat

- Partner klikt "Nieuwe installateur" → vult naam+email in → installateur krijgt mail → kiest wachtwoord → klaar
- Elke gebruiker koppelt eigen Gmail/Outlook in 1 klik via `/profiel` → mails komen vanuit eigen account
- Klik op gebruiker in lijst → volwaardige profielpagina met stats, audit, sessies, permissies, afwezigheid, MFA, handtekening
- 8 nieuwe SAAS-niveau functies maken het beheer professioneel en schaalbaar

