

## Plan: Echte web-zoek AI specificatie-invuller

### Kernprobleem
De huidige `ai-verify-product-specs` edge function vraagt een LLM om productspecificaties in te vullen, maar het model heeft **geen internettoegang**. Het kan alleen gokken op basis van trainingsdata — en retourneert daarom steeds `corrected_specs: {}`.

### Oplossing: Firecrawl + AI pipeline

Twee-staps aanpak:
1. **Zoek het product op internet** via Firecrawl Search (bijv. "LONGi LR5-54HTH-435M datasheet specificaties")
2. **Scrape de beste resultaten** voor de volledige content
3. **Extraheer specs** uit de gescrapede content met Gemini, gemapped op de juiste machine-keys

Alleen waarden die daadwerkelijk in de bronnen staan worden ingevuld.

### Stap 1: Firecrawl connector linken

Firecrawl is al beschikbaar in de workspace (`std_01kjfmtmw9fmrvqqnrjx9r39ch`) maar niet gelinkt aan het project. Dit moet eerst gelinkt worden zodat `FIRECRAWL_API_KEY` beschikbaar is als environment variable in edge functions.

### Stap 2: Herschrijf `ai-verify-product-specs`

**`supabase/functions/ai-verify-product-specs/index.ts`**

Nieuwe flow:
```text
[Client] → ai-verify-product-specs
  │
  ├─ 1. Bouw zoekquery: "{merk} {model} {naam} datasheet specificaties"
  │
  ├─ 2. Firecrawl Search API → top 3-5 resultaten met content
  │
  ├─ 3. Combineer alle gescrapede markdown content
  │
  ├─ 4. Stuur naar Gemini met prompt:
  │     "Extraheer ALLEEN waarden die in de bronnen staan.
  │      Gebruik EXACT deze machine-keys: [...]
  │      Vul NIETS in dat niet expliciet in de bron staat."
  │
  └─ 5. Return corrected_specs + bronnen
```

Wijzigingen:
- Voeg Firecrawl search + scrape toe als eerste stap
- Geef de gescrapede content mee als context aan Gemini
- Strict prompt: alleen brondata, geen schattingen
- Voeg `bronnen` (source URLs) toe aan de response zodat de gebruiker kan zien waar data vandaan komt
- Fallback: als Firecrawl niet beschikbaar is, geef duidelijke foutmelding

### Stap 3: UI update — toon bronnen

**`src/pages/ProductDetail.tsx`**

- Na succesvolle AI-invulling: toon toast met aantal gevonden specs
- Optioneel: toon de bron-URLs in een collapsible sectie zodat de partner kan verifiëren

### Bestanden

| Bestand | Actie |
|---------|-------|
| Firecrawl connector | Linken aan project |
| `supabase/functions/ai-verify-product-specs/index.ts` | Herschrijven: web search + extract pipeline |
| `src/pages/ProductDetail.tsx` | Kleine update: bronnen tonen in toast/UI |

### Technische details

- Firecrawl Search API: `POST https://api.firecrawl.dev/v1/search` met `scrapeOptions: { formats: ['markdown'] }` om direct content te krijgen
- Zoekquery strategie: `"{merk} {model} specificaties"` en `"{merk} {model} datasheet pdf"`
- Gemini ontvangt de gescrapede content als user message, niet als vision/image
- Max 3 pagina's scrapen om kosten/snelheid te beperken
- Tijdslimiet: 25 seconden totaal (Firecrawl ~10s, Gemini ~10s, overhead ~5s)

