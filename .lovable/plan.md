

## Plan — PDF download opleverrapport + installatie inplannen vanuit opdrachten

### Probleem 1: Opleverrapport-PDF wordt niet gedownload

Op `/opleveringen/:id` slaat de knop "PDF opslaan" de PDF wél op in Supabase Storage en update `pdf_url`, maar **er gebeurt niets in de browser** — geen download, geen nieuw tabblad, geen visueel signaal behalve een toast. Daardoor lijkt het alsof er niks gebeurt. Daarnaast staat het **partner-logo niet op de PDF** en zijn klantnaam/partnernaam altijd `—` omdat `OpleverRapportPDF` props `partnerNaam`/`klantNaam` verwacht maar deze nooit worden meegegeven.

### Probleem 2: Installatie inplannen ontbreekt op de opdrachten-lijst

Vanuit `OpdrachtDetail` werkt `MonteurToewijsDialog` al, maar:
- Vanaf `/opdrachten` (lijst) is er **geen snelle actie** "Installatie plannen" per rij.
- Bij prefill ontbreken een paar velden: `werkomschrijving` (uit eerste regel/notitie van de opdracht), `klant_id` en `consument_id` zodat de installatie correct gekoppeld is aan de klantkaart.

### Implementatie

**1. PDF-download betrouwbaar maken**

`src/lib/renderOpleverPdf.ts` (~+15 regels):
- Helper `triggerBlobDownload(blob, filename)` toevoegen die een `<a download>` programmatisch klikt.
- Nieuwe export `downloadOpleverPdf(el, filename, partnerId?, rapportId?)` die rendert, downloadt en optioneel archiveert.

`src/pages/OpleverDetail.tsx` (~+20 regels):
- `downloadPdf()` haalt vooraf partner-info op (logo_url + naam) en klantnaam (via `klant_id` → `klanten`-tabel; fallback: scope/snapshot).
- Geeft die door als props aan `<OpleverRapportPDF>` (rendert nu in een hidden container die altijd vol-A4 is, niet in de scroll-preview).
- Roept `downloadOpleverPdf` aan, archiveert daarna in `oplever-media` en update `pdf_url`/`pdf_hash`.
- Toast: "PDF gedownload en gearchiveerd".
- Tweede knop "Bekijk archief" verschijnt zodra `pdf_url` bestaat (signed URL uit `oplever-media`).

**2. Logo + branding op PDF**

`src/components/oplever/OpleverRapportPDF.tsx` (~+25 regels):
- Nieuwe optionele prop `partnerLogoUrl?: string`.
- In de header: links logo (max 30 mm hoog), rechts blijft de stempel; tussen beide het rapportnummer.
- Footer toont `partnerNaam` + KvK-/contactlijn als die wordt meegegeven (optioneel veld).
- A4-formaat blijft 210 mm; `pageBreakInside: avoid` op alle Sections (al aanwezig). Geen layoutbreuk.

**3. Render via off-screen container (geen scroll-clipping)**

`OpleverDetail.tsx`:
- `pdfRef` wordt verplaatst naar een verborgen full-width container (`position:fixed; left:0; top:0; opacity:0; pointer-events:none; width:210mm`). Preview-card behoudt eigen instance puur visueel zonder ref. Voorkomt half-gerenderde captures in scroll-area en garandeert dat fonts/images zichtbaar zijn voor html2canvas.

**4. Installatie inplannen vanuit `/opdrachten` lijst**

`src/pages/Opdrachten.tsx` (~+30 regels):
- Per rij in de actiekolom een extra knop **"Installatie plannen"** (icoon `Wrench`). Alleen zichtbaar wanneer status ∈ {`bevestigd`,`schouw_gepland`,`installatie_gepland`,`in_uitvoering`} en er nog geen `installatie_id` is.
- Klik opent dezelfde `MonteurToewijsDialog` met de geselecteerde opdracht als prop.
- Na succes: invalidate `["opdrachten"]` query + toast.

**5. Volledige prefill van installatievelden**

`src/components/installaties/MonteurToewijsDialog.tsx` (~+15 regels):
- `Opdracht`-interface uitbreiden met `klant_id?` en `werkomschrijving?`.
- Bij `createInstallatie` ook `klant_id`, `consument_id` (klant_id), en als `werkomschrijving` leeg is automatisch een samenvatting genereren uit eerste 3 productregels (`x stuks Y`).
- `installatienummer` via `generate_documentnummer_v2` RPC (type `installatie`, fallback bestaande prefix).

`src/pages/OpdrachtDetail.tsx` (~+5 regels):
- Doorgeven `klant_id: opdracht.klant_id ?? null` aan `MonteurToewijsDialog`.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `src/lib/renderOpleverPdf.ts` | edit — download-helper + nieuwe `downloadOpleverPdf` |
| `src/pages/OpleverDetail.tsx` | edit — partner+klant lookup, hidden render-container, archief-knop |
| `src/components/oplever/OpleverRapportPDF.tsx` | edit — logo in header, partnerNaam in footer |
| `src/pages/Opdrachten.tsx` | edit — knop "Installatie plannen" per rij |
| `src/components/installaties/MonteurToewijsDialog.tsx` | edit — extra prefill, klant_id, werkomschrijving-fallback |
| `src/pages/OpdrachtDetail.tsx` | edit — `klant_id` doorgeven |

### Geen wijzigingen aan
- Datamodel (alle velden bestaan al op `installaties` en `opleverrapporten`).
- Storage policies (gebruikt bestaande `oplever-media` bucket).
- Wizard-stappen, autosave, signing-flow.

### Bevestigingsvragen
Geen — gebruikt bestaande velden (`opleverrapporten.partner_id`, `klanten.naam`, `partners.logo_url`) en bestaande `MonteurToewijsDialog`.

