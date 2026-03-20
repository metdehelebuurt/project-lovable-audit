

## Plan: AI invullen fix — web-only strategie

### Kernprobleem
Firecrawl Search retourneert **0 resultaten** omdat de zoekquery te lang en specifiek is. De query `"SolarEdge BAT-05K48R0B-01 SolarEdge Home Battery LV 4.8kWh datasheet specificaties"` combineert merk, modelnummer, productnaam EN zoektermen — dat is te veel voor een zoekengine.

De specs staan WEL gewoon online (SolarEdge knowledge center, VP Solar, Evergy, etc.).

### Oplossing: meervoudige zoekstrategie + directe scrape fallback

**`supabase/functions/ai-verify-product-specs/index.ts`** — volledige herschrijving van `searchProductOnWeb`:

#### 1. Slimmere zoekqueries (korter, meerdere variaties)
Huidige queries:
```
"SolarEdge BAT-05K48R0B-01 SolarEdge Home Battery LV 4.8kWh datasheet specificaties"
"SolarEdge BAT-05K48R0B-01 SolarEdge Home Battery LV 4.8kWh technical specifications"
```

Nieuwe strategie — probeer tot 4 kortere queries achter elkaar, stop zodra resultaten gevonden:
```
1. "{naam} specifications"                    → "SolarEdge Home Battery LV 4.8kWh specifications"
2. "{merk} {model} datasheet"                 → "SolarEdge BAT-05K48R0B-01 datasheet"  
3. "{merk} {naam_kort} specs"                 → "SolarEdge Home Battery specs"
4. "{naam} technical data"                    → "SolarEdge Home Battery LV 4.8kWh technical data"
```

Elke query: `limit: 5`, en stop zodra er minimaal 2 resultaten met inhoud zijn.

#### 2. Meer content per resultaat ophalen
Verhoog per-pagina limiet van 4000 naar 8000 chars — de AI heeft voldoende context nodig voor spec-extractie uit productpagina's.

#### 3. Verwijder de strikte "alleen brondata" restrictie
Wanneer het Firecrawl resultaten vindt maar het exacte model niet letterlijk in de tekst staat, moet de AI alsnog specs extraheren als de data duidelijk over hetzelfde product of dezelfde productlijn gaat.

#### 4. AI trainingsdata als robuuste fallback
Als alle zoekqueries geen bruikbare resultaten opleveren: gebruik het AI-model met een prompt die EXPLICIET vraagt om specs uit trainingsdata in te vullen. Het model kent deze producten (bewezen door mijn web-search test). Markeer in de response dat het trainingsdata betreft.

#### 5. Verbeterde logging
Log per query hoeveel resultaten + chars gevonden, zodat debugging makkelijker wordt.

### Frontend aanpassing

**`src/pages/ProductDetail.tsx`** — `handleAiVerify`:
- Verwijder de PDF-routing check (user koos "Alleen web")
- Roep altijd `ai-verify-product-specs` aan, ongeacht of er een PDF is
- Toon bron-info in toast (web/trainingsdata)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/ai-verify-product-specs/index.ts` | Herschrijf zoeklogica: kortere queries, cascading, hogere limiet, trainingsdata fallback |
| `src/pages/ProductDetail.tsx` | Verwijder PDF-routing, altijd web-pipeline gebruiken |

### Technische details

```text
Nieuwe flow:
handleAiVerify (altijd)
  → ai-verify-product-specs
    → Firecrawl search: query 1 (naam + specs)
    → Firecrawl search: query 2 (merk + model) [als query 1 < 2 results]
    → Firecrawl search: query 3 (merk + korte naam) [als nog steeds < 2]
    → Combineer alle markdown content (max 24KB)
    → Gemini: extraheer specs uit bronnen OF trainingsdata
    → Return corrected_specs + bronnen[]
  → Update producten.specs
  → Toast: "X specs gevonden (bron: web/trainingsdata)"
```

### Acceptatiecriteria
- "AI invullen" voor SolarEdge Home Battery LV 4.8kWh vult minimaal 10+ specs in
- Werkt voor alle categorieën (thuisbatterij, zonnepanelen, warmtepomp, etc.)
- Duidelijke toast met aantal specs en bronvermelding
- Geen lege `corrected_specs` meer bij bekende producten

