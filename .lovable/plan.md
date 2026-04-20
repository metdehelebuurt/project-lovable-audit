

# Plan: PDF download = exact gelijk aan preview

## Probleem

Bij klikken op "PDF downloaden" gebruikt de browser `window.print()`. De resulterende PDF springt overal omdat:

1. **Geen `@media print` regels** — de browser print de hele app: sidebar, header, dialog-chrome, achtergronden, padding worden meegerendeerd en knijpen de A4-layout samen.
2. **Geen `@page`-regel** — browser past default marges (≈10mm) toe, bovenop de 20mm padding van `FinancieelPDF`. Resultaat: tekst verschuift, "FACTUUR" loopt buiten de pagina (zie screenshot rechts: "FAC1" zichtbaar + scrollbar).
3. **Browser header/footer** (datum, URL, "VF-2026-0003 - Koleff Totaaltechniek 1/2") worden afgedrukt — zichtbaar bovenaan de screenshot.
4. **Dialog wrapper + grijze achtergrond** (`background: #f3f4f6`, padding 8px, flex-centering) wordt mee-geprint.

De preview ziet er goed uit omdat hij in een dialog op scherm staat — bij print mist de "isoleer alleen de PDF"-laag.

## Oplossing

Voeg een gerichte `@media print` stylesheet toe aan `FactuurDetail.tsx` (zelfde aanpak als `OffertePDFPreview.tsx`) die:

1. **`@page { size: A4; margin: 0 }`** — geen browser-marges, de 20mm padding zit al in `FinancieelPDF`.
2. **Verbergt alles behalve de PDF**: `body > *` op `display: none`, dan alleen het dialog-content + PDF zichtbaar maken.
3. **Reset dialog-styling tijdens print**: geen `position: fixed`, geen achtergrond, geen padding, geen `max-height`/`overflow`.
4. **Verwijdert grijze wrapper-padding** rond `<FinancieelPDF />` tijdens print.
5. **`-webkit-print-color-adjust: exact`** — anders worden achtergrondkleuren (header-balken, kleurvlakken) niet geprint.
6. Geeft het PDF-element een class `pdf-print-root` zodat we het kunnen targeten.

### Code-wijziging (`src/pages/FactuurDetail.tsx`)

```tsx
{/* Inject print stylesheet */}
<style>{`
  @media print {
    @page { size: A4; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body * { visibility: hidden !important; }
    .pdf-print-root, .pdf-print-root * { visibility: visible !important; }
    .pdf-print-root {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      box-shadow: none !important;
      width: 210mm !important;
    }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; }
`}</style>

{/* Wrap PDF met print-root class, zonder grijze flex-wrapper tijdens print */}
<div className="pdf-print-root" style={{ display: "flex", justifyContent: "center", padding: "8px", background: "#f3f4f6" }}>
  <FinancieelPDF .../>
</div>
```

> Tijdens print laat de CSS de grijze `padding`/`background` van de wrapper vervallen (visibility-trick toont alleen de PDF zelf, en `pdf-print-root` wordt op 210mm geforceerd zonder achtergrond).

### Optioneel: browser header/footer
Browsers tonen bij print standaard datum + URL bovenaan/onderaan. Dat is een **browser-instelling** ("Headers and footers" in printdialoog), niet via CSS uit te zetten. Ik zal dit als toelichting in de toast melden de eerste keer dat de gebruiker download — of een korte tekst onder de download-knop:
> *"Tip: zet 'Kop- en voetteksten' uit in het printdialoog voor een schone PDF."*

## Bestanden

| Bestand | Wijziging |
|---|---|
| `src/pages/FactuurDetail.tsx` | `<style>` met `@media print` regels toevoegen, wrapper-div krijgt `pdf-print-root` class, hint-tekst onder download-knop |

### Geen wijzigingen in `FinancieelPDF.tsx` nodig
De PDF-component zelf is al correct (210mm breed, 20mm padding, A4-proporties). Het probleem zit alleen in print-isolatie van de parent layout.

