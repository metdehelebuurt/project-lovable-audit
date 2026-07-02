# Opleverrapport PDF: fail-safe handtekeningen + optimalisatie

## Probleem (zichtbaar in screenshot)

In de PDF-preview én de gegenereerde PDF verschijnt "handtekening" als kapotte afbeelding in plaats van de daadwerkelijke handtekening. Oorzaak: `rapport.installateur_handtekening.image_url` en `klant_handtekening.image_url` bevatten een **storage-pad** (bv. `partnerId/rapportId/klant-handtekening.png`) uit de private bucket `oplever-media`, geen bruikbare URL. Het `<img>` element krijgt dus een relatieve URL die 404't, en html2canvas rendert de alt-text.

Daarnaast is de huidige PDF onnodig zwaar: dezelfde JPEG van de volledige pagina wordt bij multi-page voor elke pagina opnieuw ingevoegd met een verschoven positie, waardoor het bestand exponentieel groeit bij lange rapporten.

## Oplossing

### 1. Handtekeningen fail-safe maken (kernfix)

Voor het renderen van de PDF worden alle handtekening-paths én het partnerlogo eerst voorgeladen naar `data:`-URL's (base64), zodat html2canvas ze zonder CORS/netwerk kan tekenen.

- Nieuwe helper `src/lib/opleverPdfAssets.ts`:
  - `resolveSignatureToDataUrl(path)`: probeert in volgorde: (a) al een data-URL? direct terug; (b) al een absolute http(s) URL? via `fetch → blob → FileReader` naar dataURL; (c) storage-pad? via `supabase.storage.from('oplever-media').createSignedUrl(path, 300)` en dan fetch → dataURL.
  - `resolvePartnerLogoToDataUrl(url)`: idem voor externe/publieke logo-URL.
  - Foutafhandeling: bij falen `null` teruggeven; nooit gooien.
- `OpleverDetail.tsx`: net vóór PDF-generatie (in `handleDownloadPdf` / `handleSendMail` / preview-render) de dataURL's ophalen en meegeven als props (`installateurSigDataUrl`, `klantSigDataUrl`, `partnerLogoDataUrl`).
- `OpleverRapportPDF.tsx` `SignBlock`:
  - Nieuwe prop `dataUrl?: string`.
  - Rendervolgorde: (1) `dataUrl` als `<img>` met vaste hoogte; (2) fallback: getypte naam in cursief handschriftstijl + "Digitaal ondertekend op {datum}" + kleine "✓ Geverifieerd" badge; (3) leeg-status als er echt geen ondertekening is.
  - `<img>` krijgt `onError` handler die de fallback triggert, zodat zelfs een corrupte dataURL nooit een gebroken icoontje toont.
  - `crossOrigin="anonymous"` blijft staan als extra vangnet.
- Zelfde dataURL-preload voor logo, met tekst-fallback (partnernaam in groot) bij ontbreken.

### 2. PDF-render optimaliseren

`src/lib/pdfFromElement.ts` wordt herschreven:

- Wachten op `document.fonts.ready` en op alle `<img>` binnen de container (`img.decode()` / `onload`) vóór `html2canvas`.
- Multi-page: canvas per pagina **slicen** in plaats van dezelfde grote JPEG met offset her-toevoegen. Voor elke pagina:
  1. maak een `pageCanvas` van A4-verhouding
  2. `drawImage` alleen het relevante y-segment van de bron
  3. `pageCanvas.toDataURL("image/jpeg", 0.82)` en `pdf.addImage(...)` binnen de pagina
- Kwaliteit: JPEG 0.82 (was 0.92) en `scale: 2` behouden — visueel gelijk, ~50-70% kleinere bestanden.
- Zachte page-break tussen secties: dunne witte strip (2mm) onderaan elk slice om te voorkomen dat tekst precies op de paginascheiding wordt doorgesneden. `pageBreakInside: "avoid"` op `<Section>` blijft.
- PDF-metadata zetten: `pdf.setProperties({ title, subject, author, creator })` met rapportnummer/partnernaam voor betere archivering.
- Failsafe: als preload van een specifieke asset faalt, wordt de PDF gewoon met tekst-fallback gegenereerd (nooit stille crash).

### 3. Kleine PDF-lay-outverbeteringen

- Ondertekening-sectie krijgt `pageBreakInside: avoid` én komt bij voorkeur op een nieuwe pagina als er <60mm ruimte over is (via een `pageBreakBefore` op de sectie wanneer nodig).
- `<h2>` en tabelheaders vet houden ná JPEG-compressie (voldoende contrast, kleuren aangepast van #6b7280 → #475569 waar tekst).
- Footer krijgt paginanummer "Pagina X van Y" — na render toegevoegd via `pdf.text` op elke pagina.

## Bestanden

- **Nieuw**: `src/lib/opleverPdfAssets.ts`
- **Wijzigen**: `src/lib/pdfFromElement.ts`, `src/components/oplever/OpleverRapportPDF.tsx`, `src/pages/OpleverDetail.tsx`

Geen databasewijzigingen, geen edge functions, geen breaking changes voor bestaande rapporten (Esteban's rapport OP-2026-0008 zal na deze fix de handtekeningen correct tonen zodra de PDF opnieuw wordt gegenereerd).
