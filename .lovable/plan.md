# E-mail configuratie opnieuw inrichten

Klanten lopen vast op de huidige Gmail-koppeling. We splitsen de instellingen in twee duidelijke secties, voegen per-documenttype routing toe en testen de hele flow end-to-end.

## 1. Database

Nieuwe tabel `email_routing_config` (per partner):

| kolom | type | doel |
| --- | --- | --- |
| `partner_id` (PK) | uuid | partner |
| `document_type` (PK) | text | `offerte`, `orderbevestiging`, `factuur`, `herinnering`, `chat_klant`, `chat_lead`, `notificatie`, `algemeen` |
| `bron` | text | `partner_default` \| `gebruiker_persoonlijk` \| `specifiek_account` |
| `email_account_id` | uuid (nullable) | indien `specifiek_account` |
| `updated_at`, `updated_by` | | audit |

- RLS: alleen `partner_admin` van die partner mag wijzigen; iedereen mag lezen (nodig voor verzendlogica)
- Seed: per partner één rij per documenttype met default `partner_default`
- `partners.afzender_email/naam/smtp_*` blijven het "algemeen adres"
- `email_accounts.is_default_voor_partner` blijft de markering welke gekoppelde Gmail/Outlook-mailbox het partner-default OAuth-account is

## 2. Backend

**Nieuwe helper** `supabase/functions/_shared/resolve-email-sender.ts`:
- Input: `{ partner_id, document_type, user_id? }`
- Logica: lees `email_routing_config` voor het documenttype → bepaal mailbox:
  - `partner_default` → eerst OAuth-account met `is_default_voor_partner=true`, anders SMTP-instellingen van partner
  - `gebruiker_persoonlijk` → OAuth-account van die user, fallback naar partner_default
  - `specifiek_account` → opgegeven `email_account_id`, fallback naar partner_default
- Output: `{ method: "oauth" | "smtp", account?, from_email, from_naam }`

**Update verzendfuncties** zodat ze deze helper gebruiken i.p.v. losse logica:
- `send-offerte-email` → `document_type: "offerte"` (en `orderbevestiging` op basis van offerte status)
- `email-api-send` → accepteert `document_type` param (default `chat_klant`)
- `_shared/partner-email-send.ts` & `user-email-send.ts` → routen via helper

## 3. UI — Instellingen splitsen

**Sectie A: `AlgemeenPartnerEmail.tsx`** (alleen `partner_admin`)
- Algemeen afzenderadres + naam (offertes, orderbevestigingen, facturen)
- Tabs: "Gekoppeld account" (Gmail/Outlook OAuth markeren als partner-default) + "SMTP/IMAP fallback"
- Verbeterde Gmail-wizard: stap-voor-stap met heldere foutmeldingen, redirect-URI prominent zichtbaar, "test verzenden" knop

**Sectie B: `PersoonlijkeMailkoppeling.tsx`** (bestaande `MijnEmailKoppeling` uitbreiden)
- Persoonlijke Gmail/Outlook koppelen
- Status: wanneer laatste sync, hoeveel mails gekoppeld aan leads/klanten
- "Mijn mailbox gebruiken voor inkomende communicatie" toggle

**Sectie C: `EmailRoutingTabel.tsx`** (alleen `partner_admin`)
- Tabel met alle documenttypes en per regel een dropdown:
  - "Vast partner-adres (offertes@bedrijf.nl)"
  - "Persoonlijke mailbox van verzender"
  - "Specifiek account: …" (lijst gekoppelde accounts)
- Live preview: "Een offerte van Jan wordt nu verstuurd vanaf: …"

Wijzig `src/pages/Profiel.tsx` / Instellingen zodat deze drie kaarten zichtbaar zijn op de juiste plek (admin vs. medewerker).

## 4. Klant-/lead-detailkaart logging

`email_berichten.user_id` wordt al gevuld bij OAuth-sync. Aanvulling:
- Bij verzenden via routing-helper schrijf altijd `email_berichten` rij met `via_account_id` en `document_type` zodat in lead-detail zichtbaar is "Verstuurd door Jan vanaf info@bedrijf.nl"
- Lead/klant detail: voeg "Bron" badge toe per bericht (welke mailbox)

## 5. E2E test (Playwright)

`/tmp/browser/email-routing/test.py`:
1. Login als partner_admin
2. Open Instellingen → E-mail → koppel Gmail (mock OAuth callback via directe DB-insert in test-modus)
3. Stel routing in: offerte → partner_default, chat_klant → gebruiker_persoonlijk
4. Maak nieuwe offerte → verstuur → controleer `email_send_log` heeft juiste `from_email`
5. Stuur chat-bericht naar klant → controleer dat verzendadres het persoonlijke account is
6. Open klantdetail → controleer dat beide berichten staan met juiste bron-badge

## Bestanden

**Nieuw**
- `supabase/migrations/<ts>_email_routing.sql`
- `supabase/functions/_shared/resolve-email-sender.ts`
- `src/components/instellingen/AlgemeenPartnerEmail/index.tsx` + subcomponents
- `src/components/instellingen/EmailRoutingTabel.tsx`
- `src/hooks/instellingen/useEmailRouting.ts`
- `/tmp/browser/email-routing/test.py`

**Aangepast**
- `src/components/instellingen/EmailConfiguratie.tsx` → opgesplitst / verwijderd
- `src/components/instellingen/MijnEmailKoppeling.tsx` → routing-toggle
- `supabase/functions/send-offerte-email/index.ts`
- `supabase/functions/email-api-send/index.ts`
- `supabase/functions/_shared/partner-email-send.ts`
- `supabase/functions/_shared/user-email-send.ts`
- Lead/klant detail componenten: bron-badge per bericht
- `src/integrations/supabase/types.ts` (auto)

## Out of scope
- Volledig nieuwe Gmail OAuth-flow (huidige werkt; we verbeteren alleen UX/foutmeldingen)
- Per-document override op verzendmoment (alleen globale routing per type)
- Microsoft Graph wijzigingen (Outlook werkt identiek mee in dezelfde helper)
