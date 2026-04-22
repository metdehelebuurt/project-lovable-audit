

## Plan — Reparatie "Factuur opnieuw versturen": bijlage en bericht ontbraken

### Wat er nu misgaat

1. **Vanaf de Financieel-lijst (`/financieel`)** klik je op het envelopje "Opnieuw versturen". Op die pagina staat **geen** `<div class="pdf-print-root">` in de DOM. De dialog probeert eerst dat element te vinden — als het er niet is, valt hij terug op een "headless" render via `renderFactuurPdf`. Die headless render mount `FinancieelPDF` off-screen en wacht maar **100 ms + image-loads** voordat hij snapshot maakt. In de praktijk is dat te kort: lettertypes, prijslogo's en eventueel het partner-logo zijn dan nog niet ingeladen → de PDF wordt **leeg of grotendeels wit** gegenereerd. De upload zelf slaagt, dus de mail wordt verstuurd met een **lege PDF-bijlage**.

2. **Vanaf de detailpagina** opent "E-mail versturen" eerst de PDF-preview-dialog en daarna pas de mail-dialog (`setTimeout 300`). De mail-dialog leest direct `.pdf-print-root`. Maar als de gebruiker de preview-dialog **per ongeluk sluit** (of de timing afwijkt op trage devices) is het element weg en valt hij weer terug op de tragere headless render → zelfde lege PDF.

3. **Bij het uploaden** wordt het bestand naar `email-bijlagen` geschreven en daarna in de Edge Function meteen weer gedownload. Als die download faalt (storage eventual consistency, RLS-mismatch, of het pad bevat een spatie/karakter dat URL-encoded moet zijn) retourneert `fetchAttachment` **stilzwijgend `null`** — de mail gaat dan zonder bijlage de deur uit. Geen foutmelding, geen log, gewoon "verzonden" in de UI.

4. **Het bericht ("body")**: in de huidige code gaat `html_body` correct mee, **behalve** als de gebruiker op "Verzenden" klikt vóór de body-state geïnitialiseerd is (race tussen `useEffect` en eerste render bij heropenen van de dialog). Dan wordt soms een leeg `body` doorgestuurd; de Edge Function valt terug op een **kale standaard-tekst** zonder de aanhef die de gebruiker zag.

5. **Archivering naar `facturen`-bucket** mislukt altijd voor niet-superadmins (RLS-policy is `is_superadmin` only). Dat is op zich geen blocker voor verzending, maar het betekent dat we straks wel gegenereerde PDFs willen **hergebruiken** in plaats van iedere keer opnieuw te renderen.

### Aanpak — robuust maken op alle paden

#### 1. PDF-generatie betrouwbaar krijgen

`src/lib/renderFactuurPdf.ts` — uitbreiden:
- Wachten op render verlengen tot `requestAnimationFrame` × 2 + `document.fonts.ready` + alle `<img>`-loads (al gedeeltelijk aanwezig — afmaken zonder timeout-only).
- Container niet `left:-10000px` maar **`opacity:0; pointer-events:none`** binnen viewport, zodat browser fonts/layout daadwerkelijk berekent (off-screen renders worden door sommige browsers gedeprioriteerd).
- Validatie ná render: pak één representatieve pixel-sample uit de canvas; als 99 %+ wit is → throw expliciete fout "PDF-render leeg" zodat de UI dat toont in plaats van stilzwijgend lege bijlage.
- Logo's via `crossOrigin="anonymous"` laden (al deels) en bij CORS-fail vervangen door tekstplaceholder zodat html2canvas niet faalt.

#### 2. Geen verzending zonder geverifieerde bijlage

`src/components/financieel/FactuurEmailDialog.tsx`:
- `handleSend` valideert nu al `pdfStatus === "ready"`. Daarbovenop:
  - Na upload naar `email-bijlagen`, **direct een test-download via signed URL** doen om de upload te verifiëren — zo vangen we storage-consistency issues vóór de Edge Function gaat draaien.
  - Bij faal: niet versturen, toast "Bijlage kon niet worden opgeslagen — probeer het opnieuw".
- `useEffect` initialisatie: zorg dat `to/subject/body` synchroon (vóór `void generatePdf()`) gezet zijn. Knop "Verzenden" disablen tot zowel `pdfStatus === "ready"` als `body.trim().length > 0`.
- Bij heropenen voor "opnieuw versturen": geheel resetten zodat oude lege state nooit opnieuw verzonden wordt.

#### 3. Edge Function `send-factuur-email` strenger

`supabase/functions/send-factuur-email/index.ts`:
- Als `attachment_path` is meegegeven maar `fetchAttachment` retourneert `null` → **400 teruggeven** met duidelijke melding, NIET stilzwijgend zonder bijlage versturen. Logging in `email_log` met status `mislukt` + reden.
- Validatie op `html_body`: leeg of alleen whitespace → val terug op een degelijke standaardtekst inclusief documentnummer (geen kale `Beste klant`-tekst zonder context).
- Attachment pas verwijderen ná succesvolle send (al zo, maar fail-path opruimen toevoegen om wees-bestanden te voorkomen).
- Extra log-veld toevoegen: `metadata.heeft_bijlage = true/false` zodat we achteraf in `email_log` kunnen controleren of de bijlage daadwerkelijk meeging.

#### 4. PDF-archief in `facturen`-bucket fixen voor hergebruik

Migratie:
- RLS-policy `facturen` bucket: INSERT/UPDATE/SELECT toestaan voor `partner_admin`/`partner_staff`/`backoffice` van het juiste partner_id (i.p.v. alleen superadmin).
- Padconventie: `{partner_id}/factuur/{docId}.pdf` met `upsert: true`.

`src/components/financieel/FactuurEmailDialog.tsx`:
- Bij "opnieuw versturen": **éérst** proberen de gearchiveerde PDF uit `facturen`-bucket te downloaden. Lukt dat → preview en upload die naar `email-bijlagen` (geen rerender nodig). Lukt dat niet → val terug op live render via `renderFactuurPdf`.
- Dat fixt zowel snelheid als betrouwbaarheid: een eerder verzonden factuur wordt 1-op-1 opnieuw verstuurd.

#### 5. Lijst-pagina actie zonder verrassingen

`src/pages/Financieel.tsx` (envelopje in de tabelrij):
- Geen wijziging in UI, maar de onderliggende dialog gebruikt nu het archief-eerst-pad (#4) en de geverifieerde upload (#2). Dat lost het lege-bijlage-probleem op zonder dat gebruikers naar de detailpagina hoeven.

### Verificatie achteraf

- Stuur een test-factuur en een test-voorschotfactuur opnieuw vanaf zowel `/financieel` (lijst) als `/financieel/:id` (detail).
- Controleer in `email_log`: `status='verzonden'`, `metadata.heeft_bijlage=true`.
- Open de mail in de inbox: bijlage opent als correct gerenderde PDF, body bevat de bewerkte tekst, onderwerp begint met `[Herinnering]`.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `src/lib/renderFactuurPdf.ts` | edit — robustere wait + leeg-canvas-detectie |
| `src/components/financieel/FactuurEmailDialog.tsx` | edit — upload-verificatie, archief-eerst, body/Send-validatie |
| `supabase/functions/send-factuur-email/index.ts` | edit — bijlage verplicht als path is meegegeven, body-fallback, heeft_bijlage-log |
| `supabase/migrations/<nieuw>_facturen_bucket_rls.sql` | nieuw — RLS-policies voor partner-toegang tot `facturen`-bucket |
| `src/lib/pdfFromElement.ts` | edit — `uploadPdfToFacturenBucket` werkt straks ook voor partners |

### Geen wijzigingen aan

- `_shared/email-send.ts` (SMTP/Gmail/Graph senders) — die werken correct met of zonder bijlage; we forceren alleen dat bijlage **niet null** is voor factuurmail.
- `_shared/partner-email-send.ts` — flow blijft identiek.
- `OffertePDFPreview` / `OrderbevestigingEmailDialog` — andere flows, niet door dit issue geraakt.

### Bevestigingsvragen
Geen — de oorzaken zijn eenduidig gediagnosticeerd in de code en bevestigd via `email_log` (verzendingen staan op `verzonden` zonder fout, dus het probleem zit in client-side PDF/upload race en niet in de provider).

