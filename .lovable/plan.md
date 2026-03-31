

## Plan: Partner-handtekening verplicht maken voor offerte verzenden/downloaden

### Concept

De partner/adviseur moet de offerte digitaal ondertekenen via een handtekeningpad voordat de offerte gedownload of verzonden kan worden. De handtekening wordt opgeslagen in de database en getoond op de PDF in de akkoord-sectie.

### 1. Database-migratie

Twee nieuwe kolommen op `offertes`:
- `partner_handtekening_data` (text, nullable) — base64 PNG van de handtekening
- `partner_handtekening_op` (timestamptz, nullable) — datum/tijd van ondertekening

### 2. Handtekeningpad in PDF-editor (`OffertePDF.tsx`)

In het zijpaneel bij de sectie "Voorwaarden" een SignaturePad component toevoegen (hergebruik van `src/components/schouwen/SignaturePad.tsx`). Wanneer getekend:
- Sla `partner_handtekening_data` en `partner_handtekening_op` op naar de offerte
- Toon een groen vinkje "✓ Ondertekend op [datum]"

**Blokkeer** de knoppen "Downloaden" en "E-mail" zolang `partner_handtekening_data` null is, met een melding "Onderteken de offerte eerst".

### 3. Handtekening tonen in PDF-templates (`VoorwaardenTemplates.tsx`)

Voeg een `partnerHandtekening` prop toe aan de `VoorwaardenProps` interface. In alle drie templates (TermsSimple, TermsBoxed, TermsSidebar): als `partnerHandtekening` aanwezig is, render een `<img>` van de handtekening in het "Voor akkoord — Partner" blok, met daaronder de datum.

### 4. Preview doorvoeren (`OffertePDFPreview.tsx`)

Haal `partner_handtekening_data` op uit de offerte query en geef het door als prop aan het voorwaarden-template.

### 5. Blokkeren van verzenden/downloaden

- **OffertePDFPreview.tsx**: "PDF downloaden" knop disablen als offerte geen `partner_handtekening_data` heeft
- **OfferteDetail.tsx**: "Verzenden" knop disablen als offerte geen handtekening heeft, met tooltip "Offerte moet eerst ondertekend worden in de PDF-editor"

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Migratie | `partner_handtekening_data` + `partner_handtekening_op` kolommen toevoegen |
| `src/pages/OffertePDF.tsx` | SignaturePad in zijpaneel, opslaan naar DB, blokkeren download/email zonder handtekening |
| `src/components/offertes/templates/VoorwaardenTemplates.tsx` | `partnerHandtekening` prop, handtekening-afbeelding renderen in akkoord-blok |
| `src/components/OffertePDFPreview.tsx` | Handtekening ophalen en doorvoeren naar voorwaarden-template, download blokkeren |
| `src/pages/OfferteDetail.tsx` | Verzendknop blokkeren zonder handtekening |

