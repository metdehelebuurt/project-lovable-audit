

## Plan: Categorie-bug fixen en titel aanpasbaar maken

### Gevonden problemen

1. **Verkeerde categorie op PDF-preview**: In `OffertePDFPreview.tsx` (regel 160-162) worden producten opgehaald via `.in("id", productIds)` maar **niet gesorteerd** op de volgorde van de offerte-regels. Daardoor is `producten[0]` willekeurig — het kan een zonnepaneel zijn terwijl het hoofdproduct een thuisbatterij is. De `categoryLabel` en `productNaam` op het voorblad zijn hierdoor fout.

   In `OffertePDF.tsx` (de editor) is dit wél gefixt (regel 290-291 sorteert op regelvolgorde), maar de print-preview mist dezelfde sortering.

2. **Titel niet aanpasbaar**: De grote titel op het voorblad ("Verduurzaam je huis met onze Thuisbatterij") is hardcoded in de voorblad-templates. De gebruiker kan alleen het kleine label ("Offerte") aanpassen via `hero_title`, maar niet de hoofdtitel of de categorie-tekst.

### Oplossing

#### 1. Product-sortering fixen in OffertePDFPreview.tsx

Na het ophalen van producten (regel 161-162), dezelfde sorterlogica toevoegen als in OffertePDF.tsx:

```typescript
if (prods) {
  const orderMap = new Map(productIds.map((id, i) => [id, i]));
  prods.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
  setProducten(prods);
}
```

Dit zorgt ervoor dat `producten[0]` altijd het eerste product uit de offerte-regels is, waardoor de juiste categorie en productnaam op het voorblad verschijnen.

#### 2. Titel aanpasbaar maken

Twee nieuwe velden toevoegen aan de template config in `OffertePDF.tsx` editor:

- **`hero_main_title`**: De grote koptekst (standaard: "Verduurzaam je huis")
- **`hero_category_text`**: De tweede regel (standaard: automatisch op basis van categorie, bijv. "met onze Thuisbatterij")

In de editor-zijbalk (naast het bestaande "Voorblad titel" veld):
- Input voor "Hoofdtitel" (placeholder: "Verduurzaam je huis")
- Input voor "Ondertitel" (placeholder: auto-gegenereerd uit categorie)

In alle voorblad-templates (`VoorbladTemplates.tsx`):
- Nieuwe optionele props `heroMainTitle` en `heroCategoryText`
- Waar nu `"Verduurzaam je huis"` hardcoded staat → `heroMainTitle || "Verduurzaam je huis"`
- Waar nu `categoryLabel` tekst staat → `heroCategoryText || (categoryLabel ? ...)` (fallback naar automatisch)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` | Product-sortering toevoegen (regel 161-162) |
| `src/pages/OffertePDF.tsx` | Twee nieuwe config-inputs voor titel; doorvoeren als props naar VoorbladComp |
| `src/components/offertes/templates/VoorbladTemplates.tsx` | Nieuwe props `heroMainTitle` en `heroCategoryText` in interface + alle 5 templates |

