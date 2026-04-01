

# Plan: Complete E-mail Module via OAuth (Google + Microsoft)

## Overzicht

Partners koppelen hun Gmail of Outlook account met 1 klik via OAuth. Het platform kan dan via de **Gmail API** en **Microsoft Graph API** e-mails verzenden en ontvangen. Alle correspondentie wordt automatisch gesynchroniseerd naar de database en gekoppeld aan leads/klanten.

Dit vervangt de huidige fragiele SMTP/IMAP implementatie (raw TCP sockets) door betrouwbare, officieel ondersteunde API's.

---

## Architectuur

```text
Partner klikt "Koppel Gmail" of "Koppel Outlook"
        │
        ▼
  OAuth consent flow (popup/redirect)
        │
        ▼
  Callback → Edge Function slaat refresh_token op
        │
        ▼
  Platform kan nu via API:
  ├── Verzenden (Gmail API / Graph API)
  ├── Inbox lezen (Gmail API / Graph API)
  ├── Verzonden items automatisch in sync
  └── Ontvangen mail matchen aan lead/klant
```

---

## Vereisten: OAuth Apps

Voordat we bouwen, zijn er **twee externe registraties** nodig:

1. **Google Cloud Console**: Gmail API inschakelen, OAuth consent screen + credentials aanmaken met scopes: `gmail.send`, `gmail.readonly`, `gmail.modify`
2. **Azure AD (Microsoft Entra)**: App registration met scopes: `Mail.Read`, `Mail.Send`, `offline_access`

De Client ID + Secret voor beide worden als secrets opgeslagen op het platform.

---

## Database wijzigingen

### Nieuwe tabel: `email_accounts`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| partner_id | uuid FK | |
| user_id | uuid | Wie heeft gekoppeld |
| provider | text | `google` / `microsoft` |
| email_adres | text | Het gekoppelde e-mailadres |
| access_token | text | Versleuteld, kortstondig |
| refresh_token | text | Versleuteld, langdurig |
| token_expiry | timestamptz | Wanneer access_token verloopt |
| scopes | text[] | Verleende scopes |
| actief | boolean | Default true |
| last_sync_at | timestamptz | Laatste keer inbox gesynchroniseerd |
| sync_cursor | text | Gmail historyId / Graph deltaLink |
| created_at / updated_at | timestamptz | |

### Nieuwe tabel: `email_berichten`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| email_account_id | uuid FK | |
| partner_id | uuid | |
| provider_message_id | text | Gmail/Graph message ID |
| richting | text | `inkomend` / `uitgaand` |
| van | text | Afzender |
| aan | text | Ontvanger(s) |
| onderwerp | text | |
| body_html | text | |
| body_text | text | |
| datum | timestamptz | |
| is_gelezen | boolean | |
| labels | text[] | Gmail labels / Outlook folders |
| lead_id | uuid FK nullable | Auto-matched |
| klant_id | uuid FK nullable | Auto-matched |
| offerte_id | uuid FK nullable | Indien gerelateerd |
| bijlagen | jsonb | Array met naam, grootte, download-url |
| thread_id | text | Voor threading |
| created_at | timestamptz | |

### Bestaande tabel: `partners`
- SMTP/IMAP kolommen **behouden** als fallback
- Nieuwe kolom: `email_provider` (text: `oauth_google` / `oauth_microsoft` / `smtp` / null)

### RLS
- `email_accounts`: SELECT/UPDATE eigen partner, CRUD superadmin
- `email_berichten`: SELECT eigen partner, INSERT via edge function (service role)

---

## Edge Functions

### 1. `email-oauth-callback` (nieuw)
- Ontvangt OAuth callback van Google/Microsoft
- Wisselt authorization code voor access + refresh token
- Slaat tokens op in `email_accounts`
- Haalt e-mailadres op via userinfo endpoint

### 2. `email-api-send` (nieuw)
- Vervangt SMTP-verzending voor OAuth-accounts
- Gebruikt Gmail API (`messages.send`) of Graph API (`/me/sendMail`)
- Auto-refresh van verlopen tokens
- Bericht wordt automatisch opgeslagen in `email_berichten`
- Valt terug op SMTP als partner geen OAuth heeft

### 3. `email-api-sync` (nieuw)
- Haalt nieuwe berichten op via Gmail API (`history.list`) of Graph API (`/me/messages?$filter=...`)
- Slaat op in `email_berichten`
- **Auto-match**: vergelijkt afzender/ontvanger e-mailadres met leads.email en klanten.email
- Vult `lead_id` of `klant_id` automatisch in
- Wordt periodiek aangeroepen (pg_cron elke 5 min) of on-demand

### 4. Bestaande `send-offerte-email` aanpassen
- Check of partner `email_provider = 'oauth_google'` of `oauth_microsoft`
- Zo ja: roep `email-api-send` aan i.p.v. SMTP
- Zo nee: gebruik huidige SMTP-logica (fallback)

---

## Frontend wijzigingen

### 1. E-mail Configuratie (`EmailConfiguratie.tsx`) — compleet vernieuwen

**Nieuwe "Koppel je e-mail" ervaring:**
- Twee grote knoppen: "Koppel Gmail" / "Koppel Outlook"
- Na koppeling: toon gekoppeld e-mailadres met groene check
- Knop om te ontkoppelen
- Status-indicator: laatst gesynchroniseerd
- **Fallback tab**: handmatige SMTP/IMAP voor andere providers (bestaande UI behouden)

### 2. Inbox (`EmailInbox.tsx`) — refactoren

- Haal berichten uit `email_berichten` tabel i.p.v. real-time IMAP
- Sync-knop roept `email-api-sync` aan
- E-mail detail toont volledige body (HTML gerenderd)
- Beantwoorden vanuit het platform (compose in-line)
- Filter op lead/klant/offerte

### 3. Lead/Klant Detail — e-mail tab toevoegen

- Nieuwe tab "E-mail" op LeadDetail en KlantDetail
- Toont alle `email_berichten` waar `lead_id` of `klant_id` matcht
- Mogelijkheid om direct vanuit de kaart te mailen
- Timeline-integratie: e-mails tonen in de activiteit-tijdlijn

### 4. Offerte e-mail verzending

- Bij versturen offerte: gebruik OAuth API als beschikbaar
- Bericht automatisch opgeslagen in `email_berichten` met `offerte_id`
- Volledige sync: ook in Gmail/Outlook Verzonden-map (API doet dit automatisch)

---

## OAuth Flow (technisch)

```text
1. Partner klikt "Koppel Gmail"
2. Frontend opent popup naar Google OAuth consent URL
   - client_id = platform's Google Client ID
   - redirect_uri = edge function callback URL
   - scope = gmail.send gmail.readonly gmail.modify
   - access_type = offline (voor refresh_token)
   - state = encrypted partner_id + user_id
3. Gebruiker geeft toestemming
4. Google redirect naar edge function met ?code=...
5. Edge function wisselt code voor tokens via Google token endpoint
6. Slaat refresh_token + access_token op in email_accounts
7. Sluit popup, frontend toont "Gekoppeld ✓"
```

Zelfde flow voor Microsoft met Graph API endpoints.

---

## Auto-matching logica

Wanneer een e-mail binnenkomt via sync:
1. Extract alle e-mailadressen uit `van` en `aan`
2. Zoek in `leads` tabel op `email` kolom
3. Zoek in `consumenten` / klant-gerelateerde tabellen
4. Bij match: vul `lead_id` of `klant_id` in
5. Bij geen match: bericht staat los (kan handmatig gekoppeld worden)

---

## Deliverability

- **OAuth via Google/Microsoft**: berichten worden verzonden via de officiële API's van Gmail/Outlook, wat betekent dat SPF, DKIM en DMARC automatisch correct zijn
- Geen deliverability-problemen zoals bij eigen SMTP
- Bounce-notificaties komen terug via de API
- Partner's eigen reputatie en domein worden gebruikt

---

## Secrets nodig

| Secret | Beschrijving |
|--------|-------------|
| `GOOGLE_EMAIL_CLIENT_ID` | Google Cloud OAuth Client ID |
| `GOOGLE_EMAIL_CLIENT_SECRET` | Google Cloud OAuth Client Secret |
| `MICROSOFT_EMAIL_CLIENT_ID` | Azure AD App Client ID |
| `MICROSOFT_EMAIL_CLIENT_SECRET` | Azure AD App Client Secret |

---

## Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | `email_accounts` + `email_berichten` tabellen + RLS |
| `supabase/functions/email-oauth-callback/index.ts` | Nieuw: OAuth callback handler |
| `supabase/functions/email-api-send/index.ts` | Nieuw: Verzenden via Gmail/Graph API |
| `supabase/functions/email-api-sync/index.ts` | Nieuw: Inbox sync + auto-match |
| `supabase/functions/send-offerte-email/index.ts` | Aanpassen: OAuth fallback |
| `src/components/instellingen/EmailConfiguratie.tsx` | Vernieuwen: OAuth koppeling UI |
| `src/components/email/EmailInbox.tsx` | Refactoren: lees uit DB |
| `src/components/email/EmailCompose.tsx` | Nieuw: e-mail schrijven |
| `src/pages/LeadDetail.tsx` | E-mail tab toevoegen |
| `src/pages/KlantDetail.tsx` | E-mail tab toevoegen |
| `src/pages/Berichten.tsx` | Inbox tab updaten |
| `supabase/config.toml` | Edge function configs |

---

## Bouwvolgorde

1. Secrets opvragen (Google + Microsoft OAuth credentials)
2. Database migratie (email_accounts + email_berichten)
3. OAuth callback edge function
4. Email API send edge function
5. Email API sync edge function
6. EmailConfiguratie UI vernieuwen (OAuth koppeling)
7. EmailInbox refactoren (DB-based)
8. Email compose component
9. Lead/Klant detail e-mail tab
10. send-offerte-email aanpassen voor OAuth
11. Periodieke sync instellen (pg_cron)

