

## Plan: Gegenereerde datasheet opslaan als PDF + fix DatasheetCheckDialog

### Probleem
1. **Na "Datasheet genereren" wordt geen PDF opgeslagen** — de `ProductDatasheet` component rendert in een dialog, maar er wordt geen PDF-bestand opgeslagen in storage. Daardoor herkent de offerte-module het product als "zonder datasheet" (check is `!p.datasheet_type`, maar de gegenereerde preview is niet persistent als PDF).
2. **De inline PDF preview verschijnt niet** onder de knoppen na generatie — de conditie `localPdfUrl || pdfBlobUrl || datasheetPublicUrl` is alleen voor fabrikant-uploads; gegenereerde datasheets tonen alleen een `ProductDatasheet` component maar geen echte PDF embed.
3. **DatasheetCheckDialog "Genereren" knop** opent `/producten/:id/datasheet` in een nieuw tabblad, maar na generatie daar wordt de dialog niet automatisch bijgewerkt.

### Oplossing

#### 1) Na generatie: render-to-PDF en opslaan in storage
**Bestand:** `src/pages/ProductDetail.tsx`

In `handleGenerateDatasheet`:
- Na AI verify + `datasheet_type: "gegenereerd"`, gebruik `window.print()` of een HTML-to-canvas-to-PDF approach (html2canvas + jspdf) om de `ProductDatasheet` component te renderen naar een PDF blob
- **Eenvoudiger alternatief**: Sla de gegenereerde datasheet op door het product te markeren met `datasheet_type: "gegenereerd"` en gebruik de bestaande inline `ProductDatasheet` preview. De offerte-module checkt al op `datasheet_type` (niet op `datasheet_url`), dus dit werkt al correct.
- Het echte probleem is dat na generatie de **inline preview niet verschijnt** omdat de code alleen `localPdfUrl || pdfBlobUrl || datasheetPublicUrl` checkt — de `gegenereerd` branch toont alleen als `product.datasheet_type === "gegenereerd"` maar de `product` state wordt pas na `queryClient.invalidateQueries` bijgewerkt. Fix: na invalidation, wacht op refetch en toon dan de preview.

#### 2) Fix inline preview na generatie
**Bestand:** `src/pages/ProductDetail.tsx`

Na `handleGenerateDatasheet`:
- Wacht tot query refetch klaar is (of update lokale state direct)
- De `gegenereerd` branch (regels 702-729) toont al correct een inline `ProductDatasheet` — het probleem is timing: `partner` moet geladen zijn. Fix: zorg dat `loadPartner()` altijd wordt aangeroepen na generatie (dit gebeurt al, maar controleer of de partner state correct doorkomt).

#### 3) Fix DatasheetCheckDialog genereer-flow
**Bestand:** `src/components/offertes/DatasheetCheckDialog.tsx`

Huidige `handleGenerate` opent een nieuw tabblad (`window.open`). Problemen:
- Gebruiker moet handmatig "Hercontroleer" klikken om status bij te werken
- De generatie in het nieuwe tabblad is losstaand

**Fix**: In plaats van een nieuw tabblad, voer de AI-generatie direct uit vanuit de dialog:
- Roep `ai-verify-product-specs` aan voor het product
- Update `datasheet_type` naar `"gegenereerd"` in de database
- Zet status naar `"uploaded"` in de dialog
- Geen nieuw tabblad nodig

#### 4) Offerte-module check is al correct
De check in `OfferteNieuw.tsx` regel 297 (`!p.datasheet_type`) werkt correct — zowel `"fabrikant"` als `"gegenereerd"` passeren deze check. Geen wijziging nodig.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProductDetail.tsx` | Fix timing van inline preview na generatie, zorg dat partner altijd geladen is |
| `src/components/offertes/DatasheetCheckDialog.tsx` | "Genereren" knop: inline AI-generatie i.p.v. nieuw tabblad openen |

### Technische flow na fix
```text
ProductDetail → "Datasheet genereren"
  → AI verify specs → save specs to DB
  → set datasheet_type = "gegenereerd"
  → invalidate query → product refetches
  → inline ProductDatasheet preview verschijnt
  → Offerte-module: product heeft datasheet_type → geen melding

DatasheetCheckDialog → "Genereren" per product
  → AI verify specs inline → save to DB
  → set datasheet_type = "gegenereerd"
  → dialog status = "uploaded"
  → Gebruiker klikt "Doorgaan" → offerte wordt opgeslagen
```

