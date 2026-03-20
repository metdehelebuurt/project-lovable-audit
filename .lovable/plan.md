

## Plan: Voorblad templates full A4 + hero afbeelding upload/mediakiezer

### Probleem
1. De voorblad-thumbnails en live preview vullen niet de volledige A4-hoogte — de VoorbladTemplates gebruiken `height: "100%"` maar de container stelt geen expliciete hoogte in, waardoor ze vierkant of kort renderen.
2. Hero afbeelding kan alleen via URL worden ingesteld — er is geen upload-functionaliteit of mediakiezer.

### Wijzigingen

#### 1) Voorblad templates full A4 hoogte
**Bestand:** `src/components/offertes/templates/VoorbladTemplates.tsx`

Alle 5 varianten (`HeroDark`, `HeroSplit`, `HeroMinimal`, `HeroGradient`, `HeroPhoto`) krijgen een expliciete `minHeight` op de root container:
- Voeg `minHeight: "297mm"` of `minHeight: 1123` toe aan de root `div` style van elke variant
- Dit zorgt ervoor dat zowel thumbnails (via 794×1123 container) als live preview de volledige A4-pagina vullen
- Pas de interne layout aan zodat content goed verdeeld is over de volledige hoogte (meer padding, grotere hero-secties, flex-grow op tussenruimtes)

**Bestand:** `src/pages/OffertePDF.tsx`

- Zorg dat de voorblad-pagina in `renderSection("voorblad")` een expliciete `height: "297mm"` heeft op de container div (i.p.v. alleen `minHeight`)
- Thumbnail container: bevestig dat de inner div 794×1123 is en de voorblad-component daarin past

#### 2) Hero afbeelding upload + mediakiezer
**Bestand:** `src/pages/OffertePDF.tsx`

Vervang het "Hero afbeelding URL" tekstveld in het customization panel door:
- **Upload knop**: Uploadt een afbeelding naar `partner-assets` storage bucket onder pad `{partner_id}/hero/{bestandsnaam}`, slaat de publieke URL op in `config.hero_image_url`
- **Media galerij**: Toont bestaande afbeeldingen uit `partner-assets/{partner_id}/hero/` als clickable thumbnails zodat de partner eerder geüploade afbeeldingen kan hergebruiken
- **URL invoer**: Behoudt de optie om een externe URL in te voeren als fallback
- Preview van de geselecteerde afbeelding onder het invoerveld (bestaande functionaliteit)

De upload gebruikt `supabase.storage.from("partner-assets").upload(...)` en `getPublicUrl(...)` — hetzelfde patroon als de logo-upload in Instellingen.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/offertes/templates/VoorbladTemplates.tsx` | Alle 5 varianten: full A4 hoogte met `minHeight: 1123`, verbeterde verticale layout |
| `src/pages/OffertePDF.tsx` | Voorblad container `height: 297mm`, hero upload + mediagalerij in customization panel |

