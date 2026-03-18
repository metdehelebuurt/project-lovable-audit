

## Plan: Fix datasheet generation flow + professionele PDF output

### Problemen geïdentificeerd

1. **"AI Verificatie" doet niets zichtbaar** — De knop roept de edge function aan maar als er geen specs zijn (zoals in de screenshot), krijgt de AI weinig context en het resultaat verschijnt alleen als klein blokje onder de knop dat makkelijk gemist wordt.
2. **Er is geen "Genereer" knop** — Er zijn alleen "AI Verificatie" en "Preview", geen duidelijke eenstaps-generatie.
3. **AI kent geen categorie-specifieke essentiële specs** — De prompt is generiek, niet per categorie (thuisbatterij vs zonnepanelen vs warmtepomp).
4. **PDF design is basis** — Vergeleken met het SolarEdge voorbeeld mist het secties (installatiespecificaties, afmetingen, regelgeving), visuele structuur en professionele opmaak.

### Aanpak (3 bestanden)

**1. Edge function `ai-verify-product-specs` uitbreiden**
- Categorie-specifieke essentiële parameters toevoegen aan de system prompt (bijv. thuisbatterij: bruikbare energie, DoD, roundtrip efficiëntie, spanningsbereik, celtype, afmetingen, gewicht, IP-rating, bedrijfstemperatuur, certificeringen, communicatie-interfaces, montagetype)
- Aparte parameterlijsten voor: zonnepanelen, thuisbatterij, warmtepomp, laadpaal, omvormer
- Tool schema uitbreiden met `installatie_specs` (afmetingen, gewicht, montage, IP-rating, temperatuur) en `regelgeving` naast `corrected_specs`

**2. `ProductDatasheetSection.tsx` — Flow vereenvoudigen**
- Nieuwe prominente knop "Specificatieblad genereren" die:
  1. AI aanroept (met loading state)
  2. Specs automatisch toepast op het product
  3. Direct de preview toont met download-knop
- Na generatie: duidelijk resultaatblok met "Download PDF" en "Bekijk preview" knoppen
- Verwijder de verwarrende twee-staps flow (verify → apply)

**3. `ProductDatasheet.tsx` — Professioneel herontwerp**
- Geïnspireerd op het SolarEdge voorbeeld:
  - **Header**: Partner branding met logo, naam, contactgegevens
  - **Hero**: Productafbeelding + naam + merk/model + categorie badge + omschrijving
  - **Productspecificaties**: Tabel met gegroepeerde specs (technisch, elektrisch)
  - **Installatiespecificaties**: Afmetingen, gewicht, montage, IP-rating, temperatuur (apart gerenderd)
  - **Regelgeving & Certificeringen**: Eigen sectie
  - **Garantie**: Prominent weergegeven
  - **Footer**: Partner gegevens, KvK, BTW
- Betere typografie, witruimte, kleuraccenten
- Print-optimalisatie voor A4 PDF

### Technische details

- Edge function tool schema wordt uitgebreid met `installatie_specs` object en `regelgeving` string
- ProductDatasheet ontvangt deze extra velden via het bestaande `specs` object (met prefixes `[Installatie]` of als aparte keys)
- Geen database wijzigingen nodig — specs is al JSONB
- Preview dialog krijgt grotere afmetingen en betere scroll

### Bestanden
| Bestand | Actie |
|---------|-------|
| `supabase/functions/ai-verify-product-specs/index.ts` | Categorie-specifieke prompts + uitgebreid schema |
| `src/components/producten/ProductDatasheetSection.tsx` | Vereenvoudigde flow met "Genereer" knop |
| `src/components/producten/ProductDatasheet.tsx` | Professioneel herontwerp |

