

# Plan: Korting correct verwerken in facturen

## Probleem

1. **`FactuurNieuw.tsx` (regel 144)**: `korting_totaal` staat hardcoded op `0`, waardoor kortingen uit offerteregels nooit worden opgeslagen in het financiele document.
2. **`DocumentRegelEditor.tsx` (totalen sectie)**: Toont geen "Korting" regel tussen subtotaal en BTW — in tegenstelling tot het offerte portaal dat dit wel doet.
3. **Subtotaal berekening**: `regelSubtotaal()` berekent al het bedrag **na** korting. Maar er wordt geen bruto subtotaal berekend om het verschil (= korting) apart te tonen.

## Oplossing

### 1. `FactuurNieuw.tsx` — korting_totaal correct berekenen

```typescript
// Bereken bruto (zonder korting) en netto (met korting)
const brutoTotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
const nettoTotaal = regels.reduce((s, r) => s + regelSubtotaal(r), 0);
const kortingTotaal = brutoTotaal - nettoTotaal;
```

Gebruik `kortingTotaal` in het `doc` object in plaats van de hardcoded `0`.

### 2. `DocumentRegelEditor.tsx` — kortingregel tonen

Voeg een "Korting" regel toe in de totalen sectie (tussen subtotaal en BTW), net als op het publieke offerte portaal:

```typescript
const brutoTotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
const kortingTotaal = brutoTotaal - subtotaal;

// In de totalen sectie:
{kortingTotaal > 0 && (
  <div className="flex justify-between text-green-600">
    <span>Korting</span>
    <span>-{formatCurrency(kortingTotaal)}</span>
  </div>
)}
```

### Bestanden

| Bestand | Wijziging |
|---|---|
| `src/pages/FactuurNieuw.tsx` | `korting_totaal` correct berekenen |
| `src/components/financieel/DocumentRegelEditor.tsx` | Kortingregel tonen in totalen |

### Geen database wijzigingen nodig

