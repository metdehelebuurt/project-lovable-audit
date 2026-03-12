

## Plan: AI Product Import verbeteren — meer producten, duplicaat-check, kwaliteitscontrole

### Probleem
1. AI retourneert slechts ~2 producten per verzoek
2. Geen controle op reeds bestaande producten (duplicaten)
3. Geen validatie op juistheid van geïmporteerde data

### Aanpak

**1. Edge Function (`supabase/functions/ai-product-import/index.ts`)**

- **Meer producten**: Verbeter de system prompt om expliciet te vragen om **minimaal 20 en maximaal 50 producten**, inclusief alle modelvarianten, vermogensvarianten en configuraties. Gebruik een krachtiger model (`google/gemini-2.5-pro`) voor betere resultaten.
- **Duplicaat-check server-side**: Haal bestaande producten op uit de `producten` tabel (gefilterd op merk + categorie) en stuur de lijst van bestaande model-namen mee in de AI prompt zodat het model geen duplicaten retourneert.
- **Kwaliteitsvalidatie**: Voeg server-side validatie toe die elk product controleert op:
  - Verplichte velden (naam, model, merk, prijs > 0)
  - Realistische prijsrange per categorie (bijv. zonnepanelen €50-€1000, thuisbatterij €2000-€25000)
  - Specs moeten minimaal 2 key-value pairs bevatten
  - Markeer producten die niet aan de checks voldoen met een `warning` veld
- Retourneer ook de lijst van `bestaande_producten` namen zodat de frontend dit kan tonen

**2. Frontend (`src/pages/Producten.tsx`)**

- **Duplicaat-indicatie**: In de preview-stap, toon een badge "Bestaat al" bij producten die qua naam/model erg lijken op bestaande producten (fuzzy match client-side)
- **Kwaliteitsindicator**: Toon een waarschuwings-icoon bij producten met `warning` veld (bijv. "Prijs lijkt onrealistisch")
- **Pre-selectie logica**: Deselecteer automatisch producten die al bestaan of waarschuwingen hebben
- **Teller update**: Toon het totaal aantal gevonden producten duidelijker

### Bestanden

| Actie | Bestand |
|-------|---------|
| Edit | `supabase/functions/ai-product-import/index.ts` — Betere prompt, duplicaat-check, validatie |
| Edit | `src/pages/Producten.tsx` — Duplicaat-badges, waarschuwingen, betere pre-selectie |

### Geen database wijzigingen nodig

