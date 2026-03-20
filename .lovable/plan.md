

## Plan: Specificaties-tab uitbreiden met bewerkknop, AI-invullen en PDF-download

### Probleem
De Specificaties-tab toont alleen ingevulde specs (read-only) zonder mogelijkheid om:
1. Specificaties handmatig in te vullen of te bewerken
2. AI specificaties te laten aanvullen
3. Het specificatieblad als PDF te downloaden

### Wijzigingen

**Bestand: `src/pages/ProductDetail.tsx`**

Op de Specificaties-tab drie knoppen toevoegen in de header:
- **"Bewerken"** — toggle die de `SpecsEditor` component toont (i.p.v. de read-only tabel), met een opslaan-knop die de specs naar de database schrijft
- **"AI invullen"** — roept `handleAiVerify` aan (hergebruik bestaande logica) direct vanuit deze tab
- **"Specificatieblad downloaden"** — opent de bestaande preview-dialog met `handlePreview`

Technisch:
- Nieuwe state: `editingSpecs: boolean` + `editedSpecs: Record<string, string>`
- Bij edit-mode: render de bestaande `SpecsEditor` component met `categorie` prop
- Bij opslaan: `supabase.from("producten").update({ specs: editedSpecs })` + invalidate query + toggle edit off
- De read-only weergave toont nu ook lege groepen (met lege waarden grijs) zodat je ziet wat er nog ontbreekt
- Import `SpecsEditor` en `Pencil, Save` icons

| Element | Actie |
|---------|-------|
| Header Specificaties-tab | Drie knoppen: Bewerken, AI Invullen, PDF Downloaden |
| CardContent | Toggle tussen read-only tabel en SpecsEditor |
| Opslaan | Schrijf naar DB, invalidate cache, sluit edit-mode |

