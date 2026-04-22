

## Plan — Altijd PDF genereren én tonen vóór verzenden

### Probleem
Bij verzenden van een (voorschot)factuur vanuit het overzicht of klantkaart bestaat het DOM-element `.pdf-print-root` niet. De huidige fallback zoekt naar een al-bestaande PDF in storage; vindt die niets, dan gaat de mail **zonder bijlage** weg. Dat moet stoppen — er moet áltijd een PDF gegenereerd, gepreviewd en pas na bevestiging verstuurd worden.

### Oplossing — headless PDF-generatie + preview-stap

**1. Headless render-helper** `src/lib/renderFactuurPdf.ts`
Nieuwe util die zelf de factuur rendert (geen DOM nodig op de pagina):
- Haalt `financiele_documenten` + `klanten`/`leveranciers` + `partners` (branding) op via één query
- Mount `<FinancieelPDF doc={...} klant={...} partner={...} />` in een verborgen off-screen container (`position: fixed; left: -10000px; width: 210mm`) via `ReactDOM.createRoot`
- Wacht tot fonts/afbeeldingen geladen zijn (`document.fonts.ready` + `img.decode()` op alle `<img>` in de container)
- Roept `renderElementToPdfBlob` aan op die container
- Unmount + verwijdert container
- Retourneert `{ blob, dataUrl }`

**2. `FactuurEmailDialog` — verplichte PDF + preview**
- Bij openen (en steeds als `doc.id` wijzigt): direct `renderFactuurPdf(doc.id)` aanroepen → state `pdfBlob` + `pdfDataUrl` + `pdfStatus: "loading" | "ready" | "error"`.
- Boven de velden: een **PDF-preview** (250–320px hoog) via `<iframe src={pdfDataUrl} />` met knop "Volledig openen" (opent in nieuw tabblad) en "Opnieuw genereren".
- Selector-prop blijft bestaan voor de detailpagina (sneller pad: als element gevonden → die gebruiken; anders headless render).
- "Verzenden"-knop is **disabled** zolang `pdfStatus !== "ready"`. Bij fout → duidelijke melding + knop "Opnieuw proberen"; verzenden zonder bijlage is **niet meer mogelijk**.
- Bij klik op Verzenden: upload `pdfBlob` naar `email-bijlagen` storage (bestaande `uploadPdfToStorage`), vervolgens `send-factuur-email` met `attachment_path`.

**3. PDF in `facturen`-bucket archiveren**
Na succesvolle verzending: dezelfde blob ook opslaan onder `facturen/{partner_id}/factuur/{doc.id}.pdf` (upsert), zodat de "opnieuw versturen"-fallback in de toekomst altijd een eerdere PDF vindt en voor audit/historie de versturen-PDF bewaard blijft.

**4. `ResendFactuurButton`**
Geen wijziging in API. Door punt 2 werkt resend nu ook altijd met een verse PDF + preview, ongeacht of er een storage-versie is.

### Bestanden

| Bestand | Actie |
|---|---|
| `src/lib/renderFactuurPdf.ts` | nieuw — headless React-render naar PDF blob |
| `src/components/financieel/FactuurEmailDialog.tsx` | preview-iframe, verplichte PDF, disabled-state, geen verzending-zonder-bijlage |
| `src/lib/pdfFromElement.ts` | kleine helper toevoegen: `uploadPdfToFacturenBucket(partnerId, docId, blob)` voor archivering |

### Niet in scope
- Server-side PDF-generatie (edge function met Puppeteer) — blijft client-side, consistent met huidige aanpak.
- Wijzigingen aan `FinancieelPDF`-component zelf.
- Edit-flow van bestaande facturen (apart traject).

