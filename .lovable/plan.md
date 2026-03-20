

## Plan: PDF Viewer + AI invullen via PDF

### Probleem 1: PDF niet live zichtbaar na upload
Na het uploaden van een PDF-datasheet moet de PDF direct zichtbaar zijn als embedded viewer op het Datasheet-tabblad. De huidige code doet dit al via een iframe, maar er ontbreekt een directe lokale preview na upload (voordat de query-invalidatie klaar is).

### Probleem 2: AI invullen retourneert 0 specs
De oorzaak is nu helder: de web search vindt 5 bronnen, maar het exacte model "M4328" bestaat niet in die bronnen (alleen "SMILE-G3-BAT-4.8S" etc.). Door de strikte "alleen brondata" instructie retourneert de AI terecht `corrected_specs: {}`.

De gebruiker koos voor **"Alleen PDF"**: wanneer er een fabrikant-PDF is geupload, moet AI invullen de PDF scannen — niet het web doorzoeken.

---

### Oplossing

#### 1. Lokale PDF preview na upload
**`src/pages/ProductDetail.tsx`**
- Na succesvolle upload: sla een lokale blob-URL op via `URL.createObjectURL(file)` zodat de PDF direct in de iframe verschijnt zonder te wachten op query-refresh
- Zorg dat het Datasheet-tabblad automatisch naar de PDF-viewer scrollt

#### 2. AI invullen routeert naar PDF-parser wanneer PDF beschikbaar
**`src/pages/ProductDetail.tsx`** — `handleAiVerify` aanpassen:
- Check of `product.datasheet_type === "fabrikant"` en `product.datasheet_url` bestaat
- Zo ja: roep `ai-parse-datasheet` aan (PDF lezen) in plaats van `ai-verify-product-specs` (web zoeken)
- Zo nee: val terug op de bestaande web-search pipeline
- Toon duidelijk in de toast of de specs uit de PDF of van het web kwamen

#### 3. Meer lenient web-search fallback
**`supabase/functions/ai-verify-product-specs/index.ts`**
- Als het exacte model niet gevonden wordt maar er WEL data is van hetzelfde merk/productlijn: gebruik die data en vermeld in `suggestions` dat het van een gerelateerd model komt
- Verwijder de "corrected_specs MAG NOOIT LEEG ZIJN" instructie (die is tegenstrijdig met "alleen brondata")

---

### Bestanden

| Bestand | Actie |
|---------|-------|
| `src/pages/ProductDetail.tsx` | Lokale PDF preview + AI routing naar PDF-parser |
| `supabase/functions/ai-verify-product-specs/index.ts` | Lenient fallback bij gerelateerd model |

