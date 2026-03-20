

## Plan: Fix AI specificaties, SpecsEditor layout & professionele PDF

### Drie problemen

1. **AI invullen werkt niet** — De edge function `ai-verify-product-specs` gebruikt label-gebaseerde keys (`"Vermogen (Wp)"`) maar de frontend verwacht machine-keys (`"vermogen_wp"`). De AI-output matcht nooit met de UI-definities.
2. **Specificaties staan in accordions** — De SpecsEditor toont velden in dichtgeklapte accordions. Moet een platte, overzichtelijke lijst worden.
3. **PDF datasheet ziet er niet professioneel uit** — Te krap, emoji-iconen, matige typografie, past niet bij de huisstijl (#5B58E1, Rubik font, moderne afgeronde stijl).

---

### 1. Fix AI edge function: gebruik machine-keys

**`supabase/functions/ai-verify-product-specs/index.ts`**

Vervang de hardcoded `categorySpecKeys` met een dynamische mapping gebouwd vanuit dezelfde spec-definities die de frontend gebruikt. De AI wordt gevraagd specs te retourneren met de exacte machine-keys (bijv. `vermogen_wp`, `bruikbare_capaciteit_kwh`).

Concreet:
- Bouw een key-mapping in de prompt: `vermogen_wp: Vermogen (Wp), efficiency_pct: Efficiency (%), ...`
- Instrueer de AI om EXACT die keys te gebruiken in `corrected_specs`
- Verwijder de aparte `installatie_specs` — alles gaat in één `corrected_specs` object met de juiste keys
- De frontend hoeft dan alleen `data.corrected_specs` direct als specs op te slaan

### 2. SpecsEditor: platte layout zonder accordions

**`src/components/producten/SpecsEditor.tsx`**

Vervang de accordion-layout met een platte gegroepeerde weergave:
- Elke groep als een sectie met een kleur-accent lijn + header (zoals de read-only view)
- Alle velden direct zichtbaar (geen open/dichtklappen)
- Twee-koloms grid voor de velden
- Compactere styling

### 3. Professionele PDF datasheet

**`src/components/producten/ProductDatasheet.tsx`**

Volledig herontwerp van de PDF layout:
- Verwijder emoji-iconen, gebruik typografische accenten
- Moderne header met gradient-accent, logo en contactgegevens
- Hero-sectie met product-afbeelding en key-specs als badges
- Specificaties in een strakke twee-koloms tabel per groep
- Subtielere kleuren, betere whitespace
- Footer met bedrijfsgegevens in donkere balk
- Font: Rubik (past bij platform), professionele typografie
- Kleur: primaire kleur (#5B58E1) als accent, niet als achtergrond

### 4. ProductDetail.tsx: fix AI save flow

**`src/pages/ProductDetail.tsx`**

In `handleAiVerify`:
- Sla `corrected_specs` direct op (keys matchen nu met definities)
- Geen aparte `installatie_specs` merge meer nodig
- Na opslaan: invalidate query zodat read-only view direct bijwerkt

---

### Bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/functions/ai-verify-product-specs/index.ts` | Fix: gebruik machine-keys uit definitie-schema |
| `src/components/producten/SpecsEditor.tsx` | Refactor: platte layout zonder accordions |
| `src/components/producten/ProductDatasheet.tsx` | Herontwerp: professionele moderne PDF |
| `src/pages/ProductDetail.tsx` | Fix: AI save flow aanpassen |

