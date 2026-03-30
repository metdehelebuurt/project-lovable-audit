

## Plan: Logo-variant doorvoeren in PDF preview

### Probleem

De logo-variant keuze (auto/licht/donker) werkt alleen in de **editor** (`OffertePDF.tsx`), maar niet in de **PDF preview** (`OffertePDFPreview.tsx`) die gebruikt wordt voor printen/delen. Twee problemen:

1. `OffertePDFPreview.tsx` haalt `logo_url_donker` niet op uit de database (ontbreekt in de SELECT query, regel 129)
2. Het voorblad-component krijgt geen `logoUrlDark` prop en de `voorblad_logo_variant` config wordt niet toegepast (regel 344)

### Wijzigingen

**`src/components/OffertePDFPreview.tsx`**:

1. **PartnerBranding interface** — `logo_url_donker` toevoegen
2. **Database query** (regel 129) — `logo_url_donker` toevoegen aan de SELECT
3. **Logo URL resolutie** (na regel 170) — `logoUrlDonker` variabele aanmaken, zelfde logica als `logoUrl`
4. **Voorblad render** (regel 344) — `logoUrlDark` prop toevoegen met dezelfde variant-logica als in de editor:
   ```
   const variant = tc.voorblad_logo_variant || "auto";
   if (variant === "light") → undefined
   if (variant === "dark") → logoUrlDonker || logoUrl
   default ("auto") → logoUrlDonker
   ```

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` | `logo_url_donker` ophalen + `logoUrlDark` prop doorvoeren naar voorblad |

