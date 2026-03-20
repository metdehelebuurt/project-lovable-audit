

## Plan: Betere field mapping + opslaan-knop voor producten

### Probleem
1. AI retourneert 33 specs maar slechts 14 matchen op de exacte `machine_key` namen. De andere 19 gebruiken alternatieve keys (bijv. `dimensions_mm` i.p.v. `breedte_mm`, `hoogte_mm`, `lengte_mm`).
2. Er is geen "Opslaan" knop om bijgewerkte productgegevens vast te leggen na AI invullen.

### Oplossing

#### 1) Post-processing normalisatie in edge function
**Bestand:** `supabase/functions/ai-verify-product-specs/index.ts`

Na het ontvangen van de AI response, voeg een tweede AI-stap toe die niet-gematchte keys probeert te mappen:

- Vergelijk de keys in `corrected_specs` met de toegestane `categoryMachineKeys`
- Identificeer keys die NIET in de lijst staan
- Stuur die ongematchte key-value paren naar een korte AI-prompt: "Map deze specs naar de correcte machine-keys" met de volledige lijst als referentie
- Parse samengestelde waarden automatisch:
  - `afmetingen: "540 x 258 x 540"` → `breedte_mm: "540"`, `hoogte_mm: "258"`, `lengte_mm: "540"`
  - `gewicht: "45.3 kg"` → `gewicht_kg: "45.3"`
  - `capaciteit: "4.8 kWh"` → `bruikbare_capaciteit_kwh: "4.8"`
- Verwijder eenheden uit waarden (kg, mm, kWh, V, A, etc.)
- Converteer komma-decimalen naar punt
- Filter het eindresultaat: alleen keys die in `categoryMachineKeys` staan worden opgeslagen

#### 2) Verbeterde initiële prompt
**Bestand:** `supabase/functions/ai-verify-product-specs/index.ts`

Versterk de system prompt met expliciete mapping-voorbeelden:
- "afmetingen BxHxD" → split naar `breedte_mm`, `hoogte_mm`, `lengte_mm`
- "usable energy" → `bruikbare_capaciteit_kwh`
- "continuous output power" → `nominaal_vermogen_kw`

#### 3) Opslaan-knop op productpagina
**Bestand:** `src/pages/ProductDetail.tsx`

- Voeg een "Wijzigingen opslaan" knop toe in de overzicht-tab (boven of naast bestaande knoppen)
- Deze slaat alle bewerkbare velden op (naam, merk, model, omschrijving, prijs, etc.)
- Na AI invullen verschijnt een visuele indicatie dat er onopgeslagen wijzigingen zijn (optioneel: dirty state tracking)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/ai-verify-product-specs/index.ts` | Post-processing remapping stap + betere prompt |
| `src/pages/ProductDetail.tsx` | Opslaan-knop toevoegen |

### Technische flow
```text
AI response (33 specs, gemixte keys)
  → Filter: welke keys staan WEL in categoryMachineKeys? (14 matched)
  → Ongematchte keys (19) → tweede AI call: "map deze naar correcte keys"
  → Parse samengestelde waarden (afmetingen, gewicht+eenheid)
  → Strip eenheden, fix decimalen
  → Merge alles → save alleen geldige keys
  → Resultaat: 25-30+ correct gemapte specs
```

