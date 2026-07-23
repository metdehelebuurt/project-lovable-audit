
# Doel
Garanderen dat elke offerte-mail met bijlage-intentie ook daadwerkelijk een geldige PDF meestuurt. Als dat niet lukt: verzending blokkeren, structureel loggen en een alert triggeren met `offerte_id`, `account_id`, `account_type` (gmail_oauth | ms_graph_oauth | smtp_app_password | partner_smtp) en de faalreden.

# Aanpak in het kort
1. Één centrale "attachment guard" in `send-offerte-email` die vóór elk verzendpad draait.
2. Nieuwe tabel `offerte_email_attachment_audit` voor structurele logging per poging.
3. Alert-kanaal (in-app notificatie + optionele mail naar partner-admin) bij missing/lege/invalide PDF.
4. E2E-tests per verzendpad die falen als er geen geldige PDF in de outgoing message zit.
5. Zwakhedenrapport uit de audit-logs (dashboard voor superadmin).

# Wijzigingen

## 1. Backend — `supabase/functions/send-offerte-email/index.ts`
- Nieuwe helper `enforceAttachment({ offerteId, accountId, accountType, attachmentPath, bytes })`:
  - Faalt hard (HTTP 422 `MISSING_PDF_ATTACHMENT`) als: geen `attachment_path`, storage-download leeg, `bytes.length < 1KB`, of `verifyPdfBytes` faalt (geen `%PDF-` header / geen `%%EOF`).
  - Schrijft altijd een rij in `offerte_email_attachment_audit` met status `ok | missing_path | empty | invalid_pdf | storage_error`.
- Één `sendPayload` object dat door álle takken (Gmail API, MS Graph, SMTP app-password, partner-SMTP) hergebruikt wordt; `attachments` wordt centraal geïnjecteerd en per tak wordt met een `assertHasAttachment(sendPayload)` gecontroleerd vlak vóór de netwerkoproep.
- Bij succesvolle send: audit-rij updaten met `sent_message_id` en `provider`.
- Bij falen na verzendpoging (bijv. provider strip attachments): audit-rij markeren als `sent_without_attachment` + alert.

## 2. Database — nieuwe migratie
Tabel `public.offerte_email_attachment_audit`:
- `id uuid pk`, `offerte_id uuid`, `partner_id uuid`, `user_id uuid`,
- `account_id uuid null`, `account_type text` (enum-achtig via check),
- `attachment_path text null`, `bytes_size int null`, `pdf_valid boolean`,
- `status text` (`ok|missing_path|empty|invalid_pdf|storage_error|sent_without_attachment`),
- `provider text null`, `sent_message_id text null`, `error text null`,
- `created_at timestamptz default now()`.
- RLS: `service_role` insert/update; partner_admin/superadmin select binnen eigen `partner_id`.
- GRANTs conform projectregels.

## 3. Alerts
- DB-trigger `after insert` op audit: als `status <> 'ok'` → `pg_notify` + insert in bestaande `notificaties` tabel voor partner_admin (kanaal `offerte_pdf_alert`).
- Optionele mail via bestaande `send-transactional-email` template `offerte-pdf-missing-alert` (nieuw sjabloon) naar partner-admins, throttled 1× per uur per offerte.

## 4. Frontend
- `OfferteEmailEditor`: toont een blocking foutstate wanneer de edge function `MISSING_PDF_ATTACHMENT` retourneert, met "PDF opnieuw genereren" knop.
- Nieuwe superadmin-pagina `/superadmin/email-diagnose`: lijst uit `offerte_email_attachment_audit` met filters op status/account_type/partner. Puur read-only.

## 5. E2E tests — `supabase/functions/send-offerte-email/*_test.ts`
Per verzendpad een Deno-test met een gemockte provider-transport:
- `gmail_oauth_test.ts` — verifieert MIME bevat `Content-Disposition: attachment; filename="offerte-*.pdf"` en base64 body start met `JVBERi` (PDF-magic).
- `ms_graph_test.ts` — verifieert `attachments[0].contentBytes` decodeert naar geldige PDF.
- `smtp_app_password_test.ts` — regressietest voor de eerder gemiste tak; asserteert attachment in outgoing SMTP DATA.
- `partner_smtp_test.ts` — idem voor partner-SMTP configuratie.
- `guard_test.ts` — asserteert dat elk pad met leeg/ongeldig PDF-pad 422 geeft én een audit-rij `status != 'ok'` schrijft.
Testrunner: `supabase--test_edge_functions`.

## 6. Zwakhedenrapport (op te leveren in `docs/offerte-email-pdf-zwakheden.md`)
Documenteert bekende failure modes en of ze nu afgedekt zijn:
- Snel-verstuur zonder editor (afgedekt: knop verwijderd).
- SMTP-tak zonder attachments (afgedekt: guard + test).
- Storage race (PDF nog niet klaar bij invoke) → guard blokkeert.
- Provider strip (bv. size limit >25MB) → post-send audit + alert.
- OAuth token expired midden in send → retry-once, anders alert.
- Verkeerd `attachment_path` van oude offerte-versie → guard verifieert dat pad hoort bij `offerte_id` (path-prefix check).

# Acceptatiecriteria
- Geen enkele `send-offerte-email` call kan een 200 teruggeven zonder dat er een geldige PDF in de outgoing message zat (bewezen per pad in tests).
- Elke poging (ok of fail) staat in `offerte_email_attachment_audit`.
- Bij fail krijgt de partner_admin een notificatie binnen 60s.
- Alle 5 e2e-tests slagen; CI faalt als één pad regressie krijgt.

# Technische details (kort)
- `verifyPdfBytes`: check `bytes.slice(0,5) === '%PDF-'` en laatste 1KB bevat `%%EOF`.
- `assertHasAttachment`: throw als `sendPayload.attachments?.[0]?.content?.byteLength` ontbreekt/0.
- Path-prefix check: `attachment_path.startsWith(`offertes/${offerteId}/`)`.
- Alerts throttlen via `on conflict (offerte_id, date_trunc('hour', created_at)) do nothing` in een aparte alert-tabel.
