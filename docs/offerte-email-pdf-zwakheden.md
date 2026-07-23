# Zwakhedenanalyse: PDF-bijlage bij offerte-mails

## Doel
Elke offerte-mail moet 100% van de tijd een geldige PDF-bijlage bevatten.
Deze pagina lijst bekende failure modes en of ze afgedekt zijn.

## Verzendpaden
| # | Pad | Trigger | Attachment injectie | Guard | Audit |
|---|-----|---------|---------------------|-------|-------|
| 1 | Gmail OAuth (API) | `emailAccount.access_token` + `provider=google` | `sharedSendViaGmailApi({..., attachment})` (multipart/mixed, base64) | `assertAttachmentReady` vóór send | `recordAudit(status=ok\|send_error, provider=gmail_api)` |
| 2 | Microsoft Graph OAuth | `emailAccount.access_token` + `provider=microsoft` | `sharedSendViaMsGraphApi({..., attachment})` (`contentBytes` base64) | idem | `provider=ms_graph_api` |
| 3 | SMTP App-password (persoonlijk) | `emailAccount.app_password_encrypted` | `smtpSend(..., { attachments: [...] })` via denomailer | `assertAttachmentReady` + post-guard non-empty check | `provider=smtp_app_password` |
| 4 | Partner-SMTP (fallback) | `partner.smtp_host` etc | `sharedSendViaSMTP({..., attachment})` | `assertAttachmentReady` | `provider=partner_smtp` |

Elk pad haalt zijn bytes uit exact hetzelfde `guard.attachment` object dat door
`guardAttachment` is gevalideerd — er is geen tweede storage-download tak.

## Bekende failure modes

| # | Failure mode | Oorzaak | Nu afgedekt door |
|---|--------------|---------|------------------|
| 1 | Snel-verstuur zonder editor | Lijstweergave riep `send-offerte-email` aan zonder `attachment_path` | Snelknop verwijderd + guard blokkeert `missing_path` met 422 |
| 2 | SMTP-tak stuurde bijlage niet mee | App-password branch had `attachments: [...]` ontbrekend in `smtpSend` | Guard is centraal, alle takken gebruiken hetzelfde attachment-object; post-guard non-empty check op de SMTP payload zelf |
| 3 | Storage race (PDF nog niet klaar) | Editor invoked voordat PDF-upload naar `email-bijlagen` klaar was | `guardAttachment` faalt met `storage_error` → 422 → alert |
| 4 | Verkeerde/oude PDF-versie | Front-end stuurde een pad van een oude offerte | Path-prefix check: pad moet `offerte_id` bevatten, anders `invalid_pdf` |
| 5 | Corrupte / 0-byte PDF | Rendering ging stuk maar upload voltooide | `verifyPdfBytes` (magic `%PDF-` + min 5000 bytes) → `invalid_pdf` |
| 6 | Provider strip (bijlage >25MB) | Gmail/Graph limiet | `send_error` audit + notificatie; upstream houdt PDF onder limiet (PDF wordt geoptimaliseerd bij render) |
| 7 | OAuth token expired mid-send | `token_expiry` net verlopen | Bestaand refresh-mechanisme; als refresh faalt → `send_error` + `needs_reauth` op account |
| 8 | Guard-bypass door bug | Onbedoelde codepad zonder guard | `assertAttachmentReady` gooit vlak vóór netwerkoproep in élke tak |
| 9 | Audit-schrijffout | DB-connectie hikje | Failure gelogd naar console.error maar blokkeert send niet (verzending blijft primair) |

## Alerts
DB-trigger `trg_oeaa_notify` op `offerte_email_attachment_audit` schrijft een
`notificaties`-rij (type `offerte_pdf_alert`) naar zowel de verzender als álle
partner_admins van dezelfde partner. Throttled op 1× per uur per offerte om spam
te voorkomen.

## Structured logging
Elke poging logt een JSON-regel naar de function-console met:
`request_id`, `offerte_id`, `partner_id`, `account_id`, `account_type`,
`attachment_path`, `status`, `bytes_size`, `provider`, `error`.
Zichtbaar via edge function logs; permanent gearchiveerd in
`offerte_email_attachment_audit`.

## Tests
`supabase/functions/send-offerte-email/attachment_guard_test.ts` dekt:
- missing_path, verkeerd path, storage_error, empty, te-klein, geen-magic, happy-path
- `assertAttachmentReady` bij null / 0-bytes / ongeldige PDF / geldige PDF
- MIME-serialisatie: base64 behoudt `JVBERi` PDF-magic
- SMTP payload shape: attachments array niet leeg

## Openstaande risico's (bewust geaccepteerd)
- Mailprovider kan ná succesvolle API-response de bijlage strippen bij ontvanger
  (bv. antivirus-scan bij Outlook.com). Niet detecteerbaar zonder DSN/read-receipt.
  Mitigatie: `sent_without_attachment` audit status is voorzien maar wordt pas
  gezet als een out-of-band signaal binnenkomt (nog niet geïmplementeerd).
- Denomailer SMTP bevestigt "sent" bij de eerste hop, niet bij eindbezorging.
  Bounce-webhooks zijn niet gekoppeld aan deze audit-tabel.