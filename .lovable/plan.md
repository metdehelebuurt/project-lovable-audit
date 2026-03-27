

## Plan: Voorblad toont verkeerd product — volgorde corrigeren

### Probleem

Op regel 260-263 worden producten opgehaald met `.in("id", productIds)`, wat **geen vaste volgorde** garandeert. Het eerste product in de array (`producten[0]`) wordt op het voorblad getoond (regel 552), maar dat is niet per se het eerste product uit de offerte-regels.

### Oplossing

Na het ophalen van producten, sorteer ze in dezelfde volgorde als de `regels` array. De eerste regel in de offerte is het hoofdproduct en moet op het voorblad staan.

### Wijziging

**`src/pages/OffertePDF.tsx`** (regel 262-263):

Huidige code:
```typescript
const { data: prods } = await supabase.from("producten").select("*").in("id", productIds);
if (prods) setProducten(prods);
```

Nieuwe code:
```typescript
const { data: prods } = await supabase.from("producten").select("*").in("id", productIds);
if (prods) {
  // Sorteer producten in dezelfde volgorde als de offerte-regels
  const orderMap = new Map(productIds.map((id, i) => [id, i]));
  prods.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
  setProducten(prods);
}
```

Dit zorgt ervoor dat `producten[0]` altijd het eerste product uit de offerte-regels is — het hoofdproduct dat op het voorblad hoort.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/OffertePDF.tsx` | Producten sorteren op volgorde van offerte-regels |

