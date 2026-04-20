

# Plan: PDF-bijlage bij e-mail + e-mailhistorie & meerdere e-mailadressen per klant

## Deel 1 — Oorzaak: PDF mist als bijlage

In `supabase/functions/send-offerte-email/index.ts` belooft de UI tekst _"PDF offerte wordt als bijlage bijgevoegd"_, maar de Edge Function bouwt nooit een attachment. SMTP, Gmail-API en MS Graph krijgen alleen HTML mee. Voor `send-offerte-email`, factuurmail (bestaat nog niet) en alle toekomstige varianten geldt dat er geen server-side PDF-generator is — alle PDF's worden in de browser via `window.print()` of `html2canvas + jsPDF` gemaakt.

### Aanpak: PDF in de browser genereren → uploaden → edge function bijvoegen

**Stap A — Storage bucket aanmaken (migration)**
- Nieuwe bucket `email-bijlagen` (private), RLS per partner_id pad-prefix.
- Pad-conventie: `{partner_id}/{type}/{id}-{timestamp}.pdf`.
- Auto-cleanup policy: delete na 30 dagen (lifecycle of cron).

**Stap B — Frontend PDF-generator helper**
- Nieuw bestand `src/lib/pdfFromElement.ts` (max 50 regels) met functie `renderElementToPdfBlob(el: HTMLElement): Promise<Blob>` — gebruikt `html2canvas` + `jsPDF` (al in project, zie `ProductDetail.tsx`).
- Splitsing in helpers `captureCanvas`, `canvasToPdf`, `multiPageSplit` om regel/parameter-limieten te respecteren.

**Stap C — `OfferteEmailEditor.tsx` — PDF genereren vóór verzenden**
1. Open de offerte-PDF via een hidden iframe (`/offertes/:id/pdf?print=true`) of render een verborgen `OffertePDFPreview` instance.
2. Roep `renderElementToPdfBlob()` aan → upload naar `email-bijlagen` → krijg signed URL + storage path.
3. Stuur `attachment_path` mee in de invoke-body naar `send-offerte-email`.
4. Voeg een visuele indicator toe: "PDF wordt voorbereid..." → "PDF (245 KB) wordt bijgevoegd ✓".

**Stap D — `send-offerte-email/index.ts` — bijlage bijvoegen**
- Nieuwe parameter `attachment_path` (storage key).
- Helper `fetchAttachment(adminClient, path)` → download bytes → base64.
- **SMTP (denomailer)**: gebruik `attachments: [{ filename, content: bytes, encoding: 'binary', contentType: 'application/pdf' }]`.
- **Gmail API**: bouw multipart/mixed RFC822 met base64-encoded PDF part.
- **MS Graph**: voeg `attachments` array toe aan het `message` object met `@odata.type: "#microsoft.graph.fileAttachment"` en `contentBytes`.
- Logica gesplitst in helpers `buildGmailMime(html, pdf)`, `buildGraphMessage(html, pdf)`.

**Stap E — Factuur & andere documenten gelijk meeleveren**
Inventarisatie van templates die een PDF zouden moeten meesturen:

| Template / locatie | Status nu | Actie |
|---|---|---|
| `send-offerte-email` (offerte) | HTML zonder bijlage | PDF bijvoegen via Stap D |
| **Factuur** (`FactuurDetail.tsx`) | Geen e-mailknop, alleen statuswissel naar "verzonden" | Nieuwe knop **"E-mail versturen"** + nieuwe edge function `send-factuur-email` (zelfde patroon, type='factuur') |
| **Orderbevestiging** (`OpdrachtDetail.tsx`) | Alleen `window.print()` | Knop **"E-mail versturen"** toegevoegd, hergebruikt `send-offerte-email` met `type=orderbevestiging` |
| **Productdatasheet** | `window.print()` | Geen e-mailflow gevraagd — laten zoals het is |
| **Energieadvies-PDF** | Download | Geen e-mailflow gevraagd — laten zoals het is |

`send-factuur-email` deelt 90% van de logica met `send-offerte-email`. Om binnen de 800-regelslimiet te blijven extraheren we gedeelde helpers naar `supabase/functions/_shared/email-send.ts`:
- `sendViaSMTP(...)`, `sendViaGmailApi(...)`, `sendViaMsGraphApi(...)`, `refreshOAuthToken(...)`, `fetchAttachment(...)`, `logEmailSend(...)`.

## Deel 2 — Klantkaart: e-mailgeschiedenis op basis van e-mailadres + meerdere e-mailadressen

### Database wijzigingen (migration)

1. **`klanten.extra_emails text[] DEFAULT '{}'`** — naast het primaire `email`-veld voor extra adressen.
2. **`email_berichten` koppeling op e-mailadres** — extra index voor lookup:
   ```sql
   CREATE INDEX idx_email_berichten_van ON public.email_berichten(lower(van));
   CREATE INDEX idx_email_berichten_aan ON public.email_berichten(lower(aan));
   ```
3. **Backfill-trigger**: bij `INSERT` op `email_berichten` waar `klant_id IS NULL`, automatisch matchen tegen `klanten.email` ∪ `klanten.extra_emails` (lowercase) van dezelfde `partner_id` en `klant_id` invullen.
4. Eenmalige backfill-query voor bestaande berichten.

### Frontend

**`src/pages/KlantDetail.tsx`**
- **Edit-formulier**: nieuwe sectie "E-mailadressen" met primair adres + lijst van extra adressen (toevoegen/verwijderen). Component `EmailAddressList.tsx` (max 80 regels).
- **`EmailTab` aanroep**: huidig roept met `email={klant.email}` — uitbreiden naar `emails={[klant.email, ...klant.extra_emails]}`.

**`src/components/email/EmailTab.tsx`**
- Prop wijzigen van `email?: string` naar `emails?: string[]`.
- Query uitbreiden:
  ```ts
  // Naast klant_id-match ook expliciet matchen op alle bekende e-mailadressen
  let query = supabase.from("email_berichten").select("*")
    .or(`klant_id.eq.${klantId},van.in.(${quotedEmails}),aan.in.(${quotedEmails})`)
    .order("datum", { ascending: false }).limit(50);
  ```
- Compose-knop: dropdown om uit beschikbare adressen te kiezen.

**`src/components/email/EmailCompose.tsx`**: dropdown-veld voor "Aan" met de bekende klant-adressen.

## Bestanden — overzicht

| Bestand | Actie |
|---|---|
| `supabase/migrations/...email_bijlagen_bucket.sql` | Nieuwe bucket + RLS |
| `supabase/migrations/...klanten_extra_emails.sql` | Kolom + indices + match-trigger + backfill |
| `supabase/functions/_shared/email-send.ts` | **Nieuw** — gedeelde send-helpers (SMTP/Gmail/Graph + attachment) |
| `supabase/functions/send-offerte-email/index.ts` | Refactor naar shared helpers + `attachment_path` |
| `supabase/functions/send-factuur-email/index.ts` | **Nieuw** — analoog aan offerte |
| `src/lib/pdfFromElement.ts` | **Nieuw** — html2canvas+jsPDF helper |
| `src/components/offertes/OfferteEmailEditor.tsx` | PDF genereren + uploaden vóór verzenden |
| `src/pages/FactuurDetail.tsx` | Knop "E-mail versturen" + dialog |
| `src/components/financieel/FactuurEmailDialog.tsx` | **Nieuw** — analoog aan OfferteEmailEditor |
| `src/pages/OpdrachtDetail.tsx` | Knop "E-mail versturen" |
| `src/components/email/EmailAddressList.tsx` | **Nieuw** — meerdere adressen beheren |
| `src/pages/KlantDetail.tsx` | Edit-formulier uitbreiden, `EmailTab` met `emails[]` |
| `src/components/email/EmailTab.tsx` | Prop `emails: string[]`, query aangepast |
| `src/components/email/EmailCompose.tsx` | Dropdown adres-selectie |

Alle bestanden blijven onder de 800-regelslimiet door splitsing in sub-componenten/helpers.

## Bevestiging nodig

1. **PDF-rendermethode**: akkoord met `html2canvas + jsPDF` in de browser (bestaand patroon)? Alternatief = Puppeteer in een edge function (zwaarder + nieuwe dependency).
2. **Factuur e-mailflow nu meteen meebouwen** of alleen offerte + orderbevestiging?
3. **Auto-match per e-mailadres**: alleen koppelen aan klant binnen dezelfde partner_id, en _alleen_ als `klant_id` nog leeg is — bestaande koppelingen blijven respecteren. Akkoord?

