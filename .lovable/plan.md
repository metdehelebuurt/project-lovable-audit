

## Plan: Logo op donkere achtergronden correct tonen in PDF offertes

### Probleem

1. **`PartnerBranding` interface** mist `logo_url_donker` — wordt nu via `(partner as any)` benaderd, fragiel.
2. **HeroMinimal** template destructuret `logoUrlDark` niet en gebruikt altijd het reguliere logo — ook als de achtergrond donker is (bijv. bij hero image met overlay).
3. **HeroPhoto** top-sectie heeft altijd een donkere achtergrond (gradient of image+overlay) maar valt correct terug op `darkLogo`. Dit is OK.
4. **HeroDark**, **HeroSplit**, **HeroGradient** gebruiken `darkLogo = logoUrlDark || logoUrl` — correct, maar als geen donker logo is geüpload werkt de fallback niet goed bij logo's die slecht zichtbaar zijn op donker.

### Wijzigingen

#### 1. `PartnerBranding` interface uitbreiden (`OffertePDF.tsx`)
- Voeg `logo_url_donker: string | null` toe aan de interface
- Verwijder alle `(partner as any).logo_url_donker` casts

#### 2. HeroMinimal template fixen (`VoorbladTemplates.tsx`)
- Destructure `logoUrlDark` in HeroMinimal
- Wanneer `heroImageUrl` aanwezig is (donkere overlay achtergrond): gebruik `logoUrlDark || logoUrl`
- Wanneer geen hero image: gebruik `logoUrl` (lichte achtergrond)

#### 3. Alle templates consistenter maken
- Controleer dat elk template met donkere achtergrond altijd `logoUrlDark || logoUrl` gebruikt
- Controleer dat templates met lichte achtergrond altijd `logoUrl` gebruiken

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/OffertePDF.tsx` | `logo_url_donker` toevoegen aan `PartnerBranding`, `(partner as any)` casts verwijderen |
| `src/components/offertes/templates/VoorbladTemplates.tsx` | HeroMinimal: `logoUrlDark` ondersteuning toevoegen met context-aware selectie |

