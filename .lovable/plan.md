## Doel

Affiliates krijgen een proactief opvolg-systeem: één centrale plek met **AI-gestuurde lead-score, suggesties voor de volgende actie en automatische herinneringen** voor demo's, terugbelafspraken en trials. Eén-klik om opvolging in te stellen, plus mail- en in-app notificaties die vooraf afgaan en bij stilte automatisch eskaleren.

## Wat er gebouwd wordt

### 1. Datamodel — kleine uitbreidingen

`affiliate_leads`:
- `ai_score int null` (0-100) — kans op deal.
- `ai_score_reden text null` — korte AI-uitleg.
- `ai_volgende_actie text null` + `ai_volgende_actie_op timestamptz null` — voorstel.
- `laatst_gescoord_op timestamptz null`.

Nieuwe tabel `affiliate_opvolg_taken`:
- `lead_id`, `affiliate_id`, `type` (`bel`/`mail`/`demo`/`trial_check`/`whatsapp`/`anders`),
- `titel`, `notitie`, `due_op timestamptz`, `voltooid_op timestamptz null`,
- `bron` (`handmatig`/`ai`/`automatisch`), `prioriteit` (`laag`/`normaal`/`hoog`).
- RLS: affiliate ziet alleen eigen taken; service_role voor edge functions.

Velden op `affiliate_referrals` (trial-opvolging):
- `trial_check_uitgevoerd_op timestamptz null`,
- `trial_laatste_herinnering_op timestamptz null`.

### 2. Edge Functions

a. **`ai-affiliate-lead-score`** — input `leadId`. Pakt lead + contactmomenten + terugbelhistorie, vraagt Lovable AI (`google/gemini-3-flash-preview`) om JSON: `{ score, reden, volgende_actie, volgende_actie_op_offset_dagen }`. Schrijft terug op de lead. Gebruikt bestaande gateway-helper.

b. **`ai-affiliate-opvolg-plan`** — input `leadId`, optioneel `context`. Genereert 2–4 concrete opvolg-taken (titel, type, due-datum, notitie) in NL en slaat ze op in `affiliate_opvolg_taken` met `bron='ai'`. Returnt de taken voor preview-bevestiging in UI.

c. **`affiliate-opvolg-cron`** — draait elke 15 min via pg_cron:
   - Vindt taken met `due_op` tussen nu en +24u zonder verstuurde herinnering → maakt `notificaties`-rij **en** stuurt mail via bestaande `send-transactional-email` met nieuwe template `affiliate-opvolg-herinnering`.
   - Vindt taken die >24u over tijd zijn → escalatie-mail + push naar `notificaties` (prioriteit hoog).
   - Trial-opvolging: voor elke `affiliate_referrals` met `partners.trial_einddatum` op T-7, T-3, T-1 en T+0 → mail `affiliate-trial-opvolging` aan de affiliate met klantgegevens + 1-klik knoppen.
   - Re-score: alle leads met `laatst_gescoord_op` ouder dan 48u en `status` actief → roept `ai-affiliate-lead-score` aan (gebatcht, max 25 per run).

### 3. UI — affiliate-zijde

a. **Lead-detail (`LeadDetailBody.tsx`)** krijgt een **"AI-opvolging"-kaart**:
   - Toont `ai_score` als badge + voortgangsbalk en `ai_score_reden`.
   - Knop **"Maak opvolgplan"** → roept `ai-affiliate-opvolg-plan` aan, toont gegenereerde taken in een dialog; affiliate vinkt aan welke hij wil overnemen → opslaan.
   - Knop **"Herbereken score"** (handmatig forceren).

b. **Nieuwe pagina `/affiliates/opvolging`** (subnav-link "Opvolging"):
   - Drie tabs: *Vandaag*, *Achterstallig*, *Komende 7 dagen*.
   - Lijst van `affiliate_opvolg_taken` + openstaande terugbelafspraken (gemerged), gegroepeerd per lead.
   - Bulk-acties: "Markeer afgehandeld", "Verzet 1 dag", "Bel nu".
   - Per item: AI-uitleg waarom het belangrijk is (kleine sparkline-tag).

c. **Snelle "+ Opvolging"-actieknop** in `LeadDetailBody` en op pipeline-kaart:
   - Mini-dialog: type, datum/tijd (default = AI-voorstel), notitie, prioriteit, *"AI laat een notitie voor mij achter"* (auto-fill).

d. **Trial-pagina (`AffiliateTrials.tsx`)**: per trial-card extra:
   - Eén-klik knoppen "Stuur check-in mail" (template `affiliate-trial-checkin`), "Plan demo", "Voeg opvolg-taak toe" — koppelt direct aan dezelfde taken-tabel zodat de cron erop kan reageren.

### 4. E-mailtemplates (mijnhuis.nu-huisstijl, React-Email)

Drie nieuwe in `_shared/transactional-email-templates/`:
- `affiliate-opvolg-herinnering.tsx` — "Vandaag op je lijstje: {{titel}}".
- `affiliate-opvolg-escalatie.tsx` — "Achterstallig: {{titel}}".
- `affiliate-trial-opvolging.tsx` — "Trial van {{klant}} loopt over {{dagen}} dagen af".
- `affiliate-trial-checkin.tsx` — outbound, naar de klant; vraag of hulp nodig is.

Registreren in `registry.ts`.

### 5. In-app notificaties

Hergebruik bestaande `notificaties`-tabel. Cron-edge en taakcreatie schrijven rijen met `type='affiliate_opvolging'`, link naar lead. Realtime-subscriber zit al in app — toast + bel-icoon updaten vanzelf.

### 6. Cron

Via `supabase--insert` één `cron.schedule` voor `affiliate-opvolg-cron` (elke 15 min). Aparte SQL omdat het project-URL bevat (mag niet in migratie).

### 7. Failsafe & idempotentie

- Cron gebruikt `idempotencyKey = affiliate-opvolg-${taak.id}-${fase}` om dubbele mails te voorkomen.
- Tijdvensters in **Europe/Amsterdam** (sluit aan op eerdere tijdzone-aanpak).
- AI-calls in try/catch; failures loggen naar `system_error_logs`, blokkeren UI niet.
- Lovable AI 402/429: nette toast richting affiliate met "AI even niet beschikbaar — voorstel later".

## Aannames

- Bestaande `notificaties`-tabel + realtime kanaal is bruikbaar (project memory bevestigt dit).
- Klant-mailbox voor `affiliate-trial-checkin` is `partners.email`.
- Gebruiker wil dat de AI géén mail aan klanten stuurt zonder bevestiging — alleen de **check-in template** stuurt door op expliciete klik; opvolg-mails gaan naar de affiliate zelf.

## Out of scope (nu niet)

- SMS/WhatsApp herinneringen — kan later via GatewayAPI.
- Volledige AI-conversaties met klant (auto-reply); we beperken AI tot scoren + plannen.
- Drag-and-drop kalenderweergave van taken.
