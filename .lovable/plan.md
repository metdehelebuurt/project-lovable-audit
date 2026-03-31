

## Plan: Alleen productnaam tonen in offerte-regel omschrijving

### Probleem

Bij het selecteren van een product in `OfferteNieuw.tsx` (regel 237) wordt de omschrijving samengesteld als:
```
"Alpha ESS M4328 Batterij Module 2.84 kWh — Alpha ESS M4328"
```
(naam + merk + model). Het merk en model staan vaak al in de naam, wat dubbelop is.

### Oplossing

Regel 237 aanpassen zodat alleen `product.naam` wordt gebruikt als omschrijving:

```typescript
// Was:
omschrijving: `${product.naam}${product.merk ? ` — ${product.merk}` : ""}${product.model ? ` ${product.model}` : ""}`

// Wordt:
omschrijving: product.naam
```

De gebruiker kan de omschrijving daarna nog handmatig aanpassen in het invoerveld.

### Bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/OfferteNieuw.tsx` | Regel 237: alleen `product.naam` gebruiken als omschrijving |

