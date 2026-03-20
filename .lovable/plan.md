
### Doel
`AI invullen` en `Specs uit PDF halen` moeten **betrouwbaar** technische velden vullen zodra een fabrikant-PDF is geüpload, en de PDF moet altijd leesbaar zijn in de viewer.

### Wat nu misgaat (bevestigd)
1. `ai-parse-datasheet` geeft wel `200`, maar retourneert vaak `extracted_specs: {}`.  
2. `ai-verify-product-specs` heeft regelmatig `Web search: no results`, dus web-only fallback blijft op 0 uitkomen.  
3. De PDF bevat wél bruikbare specs (tabellen), dus de bottleneck zit in de huidige parse-route (PDF als `data:application/pdf` naar model).  
4. Chrome viewer faalt nog in sommige gevallen door native iframe-PDF rendering/fallback.

### Implementatieplan

#### 1) PDF-parser opnieuw opbouwen (backend, hoofdfix)
**Bestand:** `supabase/functions/ai-parse-datasheet/index.ts`

- Stop met de huidige “PDF als image_url/data-uri” route.
- Haal eerst de echte datasheet-locatie op uit `producten.datasheet_url` (niet hardcoded `datasheets/{product_id}.pdf`).
- Maak van die URL een scrapebare URL en haal eerst tekst/markdown uit de PDF (via de bestaande web-extractiestap met Firecrawl).
- Stuur die geëxtraheerde tekst naar AI voor mapping naar machine-keys.

**Waarom:** de tekst/tabelinhoud is dan expliciet input voor de AI i.p.v. onbetrouwbare PDF-binary interpretatie.

---

#### 2) Robuuste normalisatie + mappinglaag toevoegen
**Bestand:** `supabase/functions/ai-parse-datasheet/index.ts`

Na AI output:
- Filter op toegestane keys van `categoryMachineKeys`.
- Normaliseer waarden:
  - decimal comma → punt
  - verwijder eenheden
  - bool naar `Ja/Nee`
  - bekende conversies (bijv. Wh→kWh, W→kW waar key dat vereist)
- Voeg alias mapping toe voor veelvoorkomende PDF-termen (bijv. “bruikbare energie”, “constant uitgangsvermogen”, “afmetingen BxHxD”, “roundtrip efficiency”).
- Parse `afmetingen` automatisch naar `breedte_mm`, `hoogte_mm`, `lengte_mm`.

**Resultaat:** ook bij OCR-ruis of tabelvarianten worden alsnog bruikbare velden gevuld.

---

#### 3) Kwaliteitsdrempel + duidelijke foutmeldingen
**Bestand:** `supabase/functions/ai-parse-datasheet/index.ts`

- Als `extracted_specs` leeg blijft: geef gecontroleerde fout terug (bijv. 422) met reden + tips.
- Geef extra metadata terug:
  - `filled_count`
  - `source_url`
  - `notes` (welke secties ontbraken)

**Bestand:** `src/pages/ProductDetail.tsx`
- Toon deze backend-redenen in toast i.p.v. “succes met 0”.
- Alleen “succes” tonen bij `filled_count > 0`.

---

#### 4) “Alleen PDF” afdwingen in UI flow
**Bestand:** `src/pages/ProductDetail.tsx`

- `handleAiVerify` strikt zo houden/verbeteren dat bij aanwezige fabrikant-PDF **altijd** `ai-parse-datasheet` wordt gebruikt (geen web-search pad).
- Bij directe upload in dezelfde sessie ook lokaal herkennen dat PDF beschikbaar is (niet afhankelijk van trage query-refresh).
- Na succesvolle extractie automatisch terug naar tab “Specificaties” en direct nieuwe telling tonen.

---

#### 5) PDF viewer stabiel maken voor Chrome
**Bestand:** `src/pages/ProductDetail.tsx` (en evt. nieuw viewer component)

- Blijf blob-first renderen, maar forceer MIME (`application/pdf`) bij blob-opbouw.
- Vervang native iframe-fallback door robuustere viewer-fallback (object/embed of pdf.js/react-pdf) + “Open in nieuw tabblad” fallback.
- Toon expliciete viewer-error state als laden mislukt i.p.v. lege/grijze container.

---

### Technische details
```text
Nieuwe extractieketen:
UI button
  -> ai-parse-datasheet
      -> haal datasheet_url op uit producten
      -> scrape PDF -> markdown/text
      -> AI key-mapping op die text
      -> normalize + validate + filter keys
      -> return extracted_specs + filled_count + notes
  -> update producten.specs
  -> refresh + show count
```

### Bestanden die aangepast worden
- `supabase/functions/ai-parse-datasheet/index.ts` (grootste wijziging)
- `src/pages/ProductDetail.tsx` (routing/feedback/viewer robustness)
- (optioneel) `src/components/producten/ProductPdfViewer.tsx` (als aparte robuuste viewercomponent voor onderhoudbaarheid)

### Acceptatiecriteria
- Bij geüploade PDF vult “Specs uit PDF halen” aantoonbaar meerdere velden (geen lege `extracted_specs` bij normale datasheets).
- “AI invullen” gebruikt bij fabrikant-PDF dezelfde PDF-pipeline.
- Geen succes-toast meer met 0 specs zonder waarschuwing.
- PDF is zichtbaar in Chrome; bij falen is er een duidelijke fallback-knop.
