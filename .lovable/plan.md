## Doel

1. Bij Gmail-koppeling kan de gebruiker direct een 'Verzenden als'-adres (bv. `info@smartaccu.nl`) opgeven; we voegen dat automatisch toe aan zijn Gmail account via Gmail Settings API.
2. Duidelijke waarschuwing in de wizard dat aliassen/distributielijsten zelf niet via OAuth gekoppeld kunnen worden.
3. Koppelpogingen worden gelogd zodat zichtbaar is waarom een poging strandde (popup geblokkeerd, geweigerd door Google, callback fout, etc.).

## Wat ik bouw

### 1. Nieuwe tabel `email_oauth_attempts`
Velden: `user_id`, `partner_id`, `provider`, `status` (`started`/`success`/`error`/`abandoned`), `error_code`, `error_message`, `email_adres_resultaat`, `alias_request`, `alias_status`, timestamps. RLS: gebruiker ziet eigen rijen, superadmin ziet alles. Grants conform projectstandaard.

### 2. Koppel-wizard (`EmailKoppelingWizard.tsx`)
- Bovenaan informatieblok: "Gebruik je persoonlijke Workspace-account. Gedeelde aliassen of distributielijsten (zoals `info@`) kun je niet rechtstreeks koppelen — koppel je eigen account en voeg het alias als 'Verzenden als' toe (zie veld hieronder)."
- Nieuw optioneel invoerveld **"Verzenden als (alias)"** met e-mailvalidatie. Waarde wordt meegegeven in OAuth `state`.
- Vóór OAuth: insert een `started` rij in `email_oauth_attempts` (id terug naar UI).
- Nieuwe sectie **"Recente koppelpogingen"** (laatste 5) met status-badge, foutreden en tijdstip — alleen zichtbaar als er pogingen zijn.
- Popup-blokker detectie: als `window.open` `null` teruggeeft → markeer attempt als `error/popup_blocked` en toon toast.

### 3. Scope uitbreiden
Toevoegen aan Google OAuth-scopes: `https://www.googleapis.com/auth/gmail.settings.sharing` (nodig voor sendAs). Bestaande gekoppelde users moeten éénmalig opnieuw consent geven; we vangen 403 in een aparte foutmelding "scope ontbreekt — herkoppel".

### 4. `email-oauth-callback` Edge Function
- Verwerkt extra `alias_email` in state.
- Update bijbehorende `email_oauth_attempts`-rij naar `success` of `error` met details.
- Bij `alias_email`: POST naar `gmail.googleapis.com/gmail/v1/users/me/settings/sendAs` met `{ sendAsEmail, treatAsAlias: true }`. Google stuurt verificatiemail naar dat adres.
- Sla `alias_status=verification_sent` op; toon in UI dat de gebruiker de verificatiemail moet bevestigen.
- Alle fouten (token exchange, scope, sendAs) leggen we ook vast in de attempt-rij zodat ze in de UI zichtbaar zijn.

### 5. UI feedback na callback
`postMessage` van de result-pagina meldt naast success/error nu ook `alias_status` ("verzonden", "al geverifieerd", "mislukt") + foutreden. Wizard toont passende toast en ververst pogingenlijst.

## Belangrijke beperkingen

- We kunnen niet detecteren wanneer een gebruiker het Google-toestemmingsscherm sluit zonder akkoord — die pogingen blijven `started` totdat een TTL (24u) ze op `abandoned` zet. Voor nu accepteren we dat; eventueel later via cron.
- Send As werkt alleen als het alias daadwerkelijk e-mail kan ontvangen (Google stuurt een verificatielink). Voor een pure distributielijst zonder eigen inbox blijft handmatige Workspace-config nodig.
- Bestaande gekoppelde accounts (zoals Roshny) krijgen pas de Send-As-mogelijkheid na herkoppeling vanwege de extra scope.

## Bestanden

- `supabase/migrations/...` — nieuwe tabel + RLS + grants
- `supabase/functions/email-oauth-callback/index.ts` — alias support + attempt-logging
- `src/components/gebruikers/EmailKoppelingWizard.tsx` — alias-veld, waarschuwing, pogingenlijst, popup-detectie
- (eventueel) klein hookje `useOauthAttempts.ts` om de lijst op te halen
