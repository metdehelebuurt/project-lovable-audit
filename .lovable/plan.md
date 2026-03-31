

## Plan: Witte pagina fix, BTW zichtbaarheid en BTW bewerkbaar per product

### 1. Witte laatste pagina verwijderen

**Oorzaak**: Regel 587 in `OffertePDFPreview.tsx` zet `pageBreakAfter: "always"` als inline style op gegenereerde datasheets. Inline styles overschrijven de CSS-regel `.pdf-page:last-child { page-break-after: avoid }`.

**Fix**: Verwijder `pageBreakAfter: "always"` uit de inline style op regel 587. De CSS-regel op regel 609 (`page-break-after: always`) geldt al voor alle `.pdf-page` elementen, en regel 610 (`:last-child`) voorkomt de break na het laatste element.

### 2. BTW percentage zichtbaar op offerte prijstabel

**Huidige situatie**: Alleen het `PriceDetailed` template toont BTW% per regel. De andere 3 templates (Classic, Modern, Compact) tonen geen BTW per product.

**Fix**: In `PrijstabelTemplates.tsx`:
- **PriceClassic**: Een "BTW" kolom toevoegen aan de tabel (na Korting, voor Subtotaal) met `r.btw_percentage%`
- **PriceModern**: BTW% toevoegen aan de detail-regel onder elk product (bijv. `21% BTW`)
- **PriceCompact**: BTW% toevoegen achter het subtotaal per regel

### 3. BTW percentage bewerkbaar in ProductDetail

**Huidige situatie**: `ProductDetail.tsx` toont het BTW percentage als read-only tekst. Het `handleSaveProduct` (regel 505) stuurt `btw_percentage` niet mee naar de database. Er is geen invoerveld om het aan te passen.

**Fix in `ProductDetail.tsx`**:
- Het BTW-veld in het overzicht (regel 589-592) vervangen door een bewerkbaar `Select` dropdown met opties: 0%, 9%, 21%
- Bij wijziging `isDirty` op `true` zetten zodat de bestaande "Wijzigingen opslaan" knop verschijnt
- `btw_percentage` toevoegen aan het `handleSaveProduct` update-object (regel 505-514)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` | Inline `pageBreakAfter` verwijderen van datasheet divs (regel 587) |
| `src/components/offertes/templates/PrijstabelTemplates.tsx` | BTW% kolom/info toevoegen aan Classic, Modern en Compact templates |
| `src/pages/ProductDetail.tsx` | BTW select dropdown toevoegen + `btw_percentage` meesturen bij opslaan |

