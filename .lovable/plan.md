## Analyse — waarom de offerte zonder PDF aankwam

Er zijn **twee verzendpaden** voor offerte-mails, en één daarvan stuurt structureel geen bijlage mee.

### Pad A — Rich editor (`OfferteEmailEditor.tsx`)
Werkt zoals bedoeld: opent modal → genereert PDF client-side via een verborgen iframe (`generateOffertePdfViaIframe`) → upload naar `email-bijlagen` bucket → knop "Versturen" is geblokkeerd tot `pdf.status === "ready"` → invoke met `attachment_path`.

### Pad B — Snelknop "E-mail versturen" op de offertelijst (`src/pages/Offertes.tsx`, regel 962–989)
Roept `send-offerte-email` aan met **alleen** `offerte_id` + `ontvanger_email`. Géén `attachment_path`, géén PDF-generatie. De edge function bouwt dan alleen een HTML-body en verstuurt zonder bijlage — dat is de mail die Hoang naar Meerakkers stuurde.

### Bijkomende zwakke plekken (ook in pad A)
1. **Edge function heeft geen failsafe**: `attachment_path` is optioneel. Als `attachment` `null` is, wordt gewoon verzonden. Er is geen server-side check "offertes moeten een PDF hebben". `verifyPdfBytes` bestaat in `_shared/email-send.ts` maar wordt hier niet aangeroepen.
2. **Client-side PDF-generatie is fragiel**: iframe + `html2canvas` + fonts + externe datasheet-fetches in `pdf-lib`. Faalt stil bij achtergrond-tab throttling, CORS, ontbrekende fonts, popup-blockers, of trage `/offertes/:id/pdf/print` route → timeout na 30s. Als generatie faalt kan de gebruiker het formulier sluiten en Pad B gebruiken (geen bijlage).
3. **Bijlage wordt direct na verzenden verwijderd** uit storage → geen forensische controle achteraf of hersturen mogelijk zonder opnieuw te renderen.
4. **Geen server-side PDF-fallback**: als client-render faalt, is er geen alternatief.
5. **Geen logging van bijlage-status** in `email_log` (kolom `imap_saved` is er wel, maar geen `attachment_ok` / `attachment_size`).

## Verbeterplan

### 1. Snelknop-pad afsluiten (grootste fix, blokkeert het reële probleem)
`src/pages/Offertes.tsx`: verwijder het inline snelverstuur-dialoog (regels 962–…). Vervang de "E-mail"-actieknop door **altijd** de `OfferteEmailEditor` te openen (die de PDF garandeert). Zo bestaat er nog maar één verzendpad met een PDF-garantie.

### 2. Server-side failsafe in `send-offerte-email`
- Maak `attachment_path` **verplicht** voor `action === "send"` (default action).
- Roep `verifyPdfBytes(attachment.bytes)` aan na `fetchAttachment`; bij `ok:false` → 400 met duidelijke fout, géén verzending.
- Log `attachment_size`, `attachment_ok` en `attachment_path` in `email_log` (nieuwe kolommen of in bestaand `metadata` JSON).
- Verwijder de storage-cleanup direct na verzending; laat een cron/retentie het opruimen na bv. 30 dagen zodat hersturen en audit mogelijk blijven.

### 3. Server-side PDF-fallback (backup als browser-render faalt)
Nieuwe edge function `render-offerte-pdf` die dezelfde print-route rendert via headless HTML → PDF (bv. via `deno-puppeteer` op een externe service of via `pdf-lib` templating van bestaande data). In `OfferteEmailEditor`:
- Als `generateOffertePdfViaIframe` faalt of >20s duurt → toon "PDF genereren op de server…" en roep de fallback aan.
- Als beide falen → verzendknop blijft geblokkeerd met duidelijke foutmelding + "Probeer opnieuw".

### 4. Hardening client-generator
- Verhoog aandacht voor achtergrond-tab: waarschuw als `document.visibilityState === 'hidden'` bij start.
- Log naar `system_error_logs` bij falen zodat we patronen zien.
- Toon PDF-grootte + preview-link in de editor (dat is er al) én blokkeer verzending als `sizeBytes < 5000` (magic-bytes check ook client-side).

### 5. Regressietest
Playwright-test: open offerte → klik "Versturen" → verwacht dat de invoke naar `send-offerte-email` een `attachment_path` bevat. Tweede test: mock storage-download in edge function met een niet-PDF blob → verwacht 400.

## Uit te voeren wijzigingen (samengevat)

```text
FE
 - src/pages/Offertes.tsx           snelverstuur-dialoog verwijderen, altijd editor openen
 - src/components/offertes/OfferteEmailEditor.tsx
                                    server-fallback aanroep + betere foutmeldingen + min-size check

BE
 - supabase/functions/send-offerte-email/index.ts
                                    attachment verplicht + verifyPdfBytes + logging + geen cleanup
 - supabase/functions/render-offerte-pdf/index.ts (nieuw, optioneel fase 2)
                                    server-side PDF-fallback

DB
 - migratie: email_log kolommen attachment_ok bool, attachment_size int, attachment_path text
```

## Volgorde van uitvoering
1. **Direct** — stap 1 + 2 (elimineert het geobserveerde probleem in 1 release).
2. **Kort daarna** — stap 4 + 5 (hardening + test).
3. **Later** — stap 3 (server-side render als vangnet).
