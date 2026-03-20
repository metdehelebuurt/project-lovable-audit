

## Plan: PDF Datasheet Scanner + Fix AI Import Specs

### Probleem 1: Geen PDF scan bij handmatige upload
Wanneer een partner een fabrikant-datasheet PDF uploadt, worden de specificaties niet automatisch uitgelezen. De PDF wordt alleen opgeslagen als bestand.

### Probleem 2: AI Product Import vult verkeerde spec-keys in
De `ai-product-import` edge function vraagt om "gewicht (kg), afmetingen (mm)" etc. maar specificeert NIET de exacte machine-keys (`vermogen_wp`, `gewicht_kg`). Hierdoor komen specs binnen met menselijk-leesbare keys die niet matchen met het `categorySpecDefinitions` schema. Ze worden opgeslagen maar niet getoond in de specs-tabel.

---

### Oplossing 1: Nieuwe edge function `ai-parse-datasheet`

**`supabase/functions/ai-parse-datasheet/index.ts`** (nieuw)

Werking:
1. Ontvangt `product_id` en `categorie` van de client
2. Haalt de PDF op uit storage (`datasheets/{product_id}.pdf`)
3. Converteert PDF naar base64 en stuurt het als document naar Gemini (vision/multimodal)
4. AI extraheert alle specificaties en mapt ze naar de exacte machine-keys per categorie (hergebruikt dezelfde `categoryMachineKeys` + `keyLabelMap` die al in `ai-verify-product-specs` staan)
5. Retourneert `corrected_specs` object

**`src/pages/ProductDetail.tsx`** — Na succesvolle PDF upload:
- Toon een knop "Specificaties uit PDF extraheren" of trigger automatisch
- Roep `ai-parse-datasheet` aan
- Merge de gevonden specs met bestaande specs en sla op

### Oplossing 2: Fix AI Product Import spec-keys

**`supabase/functions/ai-product-import/index.ts`**

- Voeg de `categoryMachineKeys` mapping toe aan het systeem-prompt (net zoals `ai-verify-product-specs` dat doet)
- Instrueer de AI om EXACT de machine-keys te gebruiken als spec-keys
- Dit zorgt ervoor dat geïmporteerde producten direct correcte spec-keys hebben die in de UI getoond worden

---

### Bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/functions/ai-parse-datasheet/index.ts` | **Nieuw** — PDF scanner edge function |
| `supabase/functions/ai-product-import/index.ts` | Fix: voeg machine-keys toe aan prompt |
| `src/pages/ProductDetail.tsx` | Na upload: knop om specs uit PDF te extraheren |

### Technische details

- Gemini ondersteunt PDF als multimodal input via base64 inline_data met mime_type `application/pdf`
- De edge function haalt de PDF op via Supabase Storage service role key
- Dezelfde `categoryMachineKeys` structuur wordt gedeeld tussen alle drie de edge functions voor consistentie

