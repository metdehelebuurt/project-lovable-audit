

# Plan — Echte PDF-bijlage bij offerte-mail + klikbare preview vóór verzending

## Probleem

De huidige flow rendert het scherm met `html2canvas` en plaatst die afbeelding in een PDF. Resultaat: één lange screenshot van de A4-thumbnails uit de editor. Geen echte pagina's, vage tekst, geen klikbare links, en de inhoud klopt niet met wat de klant op de portal ziet.

Bovendien staat er geen `.pdf-print-root` class op `OffertePDFPreview`, dus de iframe-fallback pakt `document.body` → de hele pagina inclusief lay-out.

## Oplossing in twee stappen

### 1. Echte A4-PDF genereren (page-perfect, scherpe tekst)

`OffertePDFPreview` (de print-route `/offertes/:id/pdf/print`) bevat al de volledige PDF-inhoud opgebouwd uit React-secties (voorblad, producten, prijstabel, etc.). We zorgen dat elke sectie correct als losse A4-pagina rendert.

**Technisch:**
- `OffertePDFPreview` krijgt een wrapper `<div class="pdf-print-root">` om de volledige content, met daarbinnen per sectie een `<div class="pdf-page" style="width:210mm; height:297mm;">` (al deels aanwezig — we standaardiseren dit op alle template-componenten).
- Nieuwe helper `src/lib/pdfFromPages.ts`: pakt **elke `.pdf-page` apart**, rendert per pagina via `html2canvas` op scale 2, en plaatst die als één pagina in de PDF. Geen "knip-een-lange-screenshot-in-stukjes"-logica meer.
- Hoge kwaliteit: PNG ipv JPEG, scale 3 voor scherpere tekst, A4-afmetingen exact (210×297 mm).
- Async font loading: wacht op `document.fonts.ready` in het iframe vóór render — voorkomt vage/missende glyphs.

> Echte vector-PDF (selectable text) zou Puppeteer in een edge function vereisen. Binnen de browser blijft het beeld-per-pagina, maar door per A4 te renderen op scale 3 met PNG wordt het visueel gelijk aan de portal-PDF en oneindig veel beter dan de huidige screenshot.

### 2. Klikbare PDF-preview onder het mailformulier

Aanpassing in `OfferteEmailEditor.tsx`:
- Bij openen van het dialoog: PDF wordt **direct** gegenereerd en geüpload (loader: "PDF voorbereiden…").
- Zodra klaar: toon onderin het dialoog een **PDF-preview blok**:
  - Bestandsnaam + grootte (`Offerte-OF-251231-0001.pdf — 312 KB`)
  - Knop "📎 PDF openen in nieuw tabblad" (opent signed URL → klikbaar pdf-bestand)
  - Knop "↻ Opnieuw genereren" voor als gebruiker tussendoor sectiekeuzes wijzigt
- "Versturen"-knop is **gedisabled** zolang de PDF niet klaar is.
- Bij verzenden gaat exact dezelfde geüploade PDF mee als bijlage (`attachment_path` blijft hetzelfde patroon → bestaande `send-offerte-email` edge function ongewijzigd).
- Bij sluiten van dialoog zonder versturen: signed URL revoke + tijdelijke storage opruiming via TTL (al ingebakken in `email-bijlagen` bucket).

**Signed URL ophalen:**
```ts
const { data } = await supabase.storage.from("email-bijlagen")
  .createSignedUrl(path, 3600); // 1 uur geldig voor preview
```

## Bestanden

| Bestand | Actie |
|---|---|
| `src/lib/pdfFromPages.ts` | **Nieuw** — render per `.pdf-page` één PDF-page op scale 3 + PNG |
| `src/lib/pdfFromElement.ts` | Behouden (nog gebruikt door factuur/orderbevestiging) |
| `src/components/OffertePDFPreview.tsx` | Wrap in `.pdf-print-root` + standaardiseer `.pdf-page` per sectie + wacht op `document.fonts.ready` |
| `src/components/offertes/OfferteEmailEditor.tsx` | PDF generen-bij-openen, signed URL preview-blok, knop "Opnieuw genereren", verzendknop disabled tot PDF klaar |

## Niet wijzigen

- `send-offerte-email` edge function (werkt al correct met `attachment_path`)
- `email-bijlagen` storage bucket
- Factuur-, orderbevestiging-mailflow (laten we voor nu ongemoeid; als deze ook de "screenshot-PDF" hebben, vragen we daarna of we dezelfde upgrade daar ook willen toepassen)

## Resultaat

- Gebruiker opent "Versturen per e-mail" → PDF wordt voorbereid (1-3s) → klikbare preview onderin
- Gebruiker controleert de PDF in nieuw tabblad
- Klik "Versturen" → klant ontvangt **exact dezelfde** scherpe, multi-page A4-PDF als bijlage
- Geen screenshot-look meer

