

## Plan: Fix 3 bugs — Opdrachten visibility, offerte tekst persistence, storage RLS

### Bug 1: Geaccepteerde offertes verschijnen niet in Opdrachten

**Oorzaak**: De `offerte-accept` edge function maakt opdrachten correct aan met service_role_key (bypasses RLS). Maar de `opdrachten` tabel mist een SELECT RLS-policy voor `partner_admin` en `partner_staff`. Hierdoor kunnen partners hun opdrachten niet zien via de frontend.

**Oplossing**: Database migratie toevoegen met SELECT policy:
```sql
CREATE POLICY "Partner users zien eigen partner opdrachten"
ON public.opdrachten FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) IN ('partner_admin', 'partner_staff')
  AND partner_id = get_user_partner_id(auth.uid())
);

CREATE POLICY "Superadmin ziet alle opdrachten"
ON public.opdrachten FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));
```

### Bug 2: Offerte tekstvelden worden niet opgeslagen bij bewerken

**Oorzaak**: In `src/pages/Offertes.tsx` ontbreekt `introductie_tekst`, `garantie_voorwaarden` en `installatie_termijn` in zowel de `OfferteFormData` interface als de `saveMutation`. Bij het bewerken van een offerte worden deze velden weggelaten uit de update query, waardoor ze op `null` worden gezet.

**Oplossing**: 
- `OfferteFormData` uitbreiden met `introductie_tekst`, `garantie_voorwaarden`, `installatie_termijn`
- `emptyForm` default values toevoegen
- `saveMutation` record aanvullen met deze 3 velden
- Edit form UI uitbreiden met invoervelden voor deze teksten
- Bij het laden van een bestaande offerte voor bewerking ook deze velden vullen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Offertes.tsx` | Interface + form + save + UI uitbreiden |

### Bug 3: Partners kunnen geen specificaties uploaden (storage RLS)

**Oorzaak**: De `product-images` bucket heeft alleen een INSERT policy. Bij `upsert: true` (wat gebruikt wordt in `DatasheetCheckDialog.tsx` en `ProductDatasheetSection.tsx`) is ook een UPDATE policy nodig. Deze ontbreekt.

**Oplossing**: Database migratie toevoegen:
```sql
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');
```

### Samenvatting wijzigingen

| Item | Bestand/Migratie |
|------|-----------------|
| RLS opdrachten | Migratie: SELECT policies voor partner_admin, partner_staff, superadmin |
| Offerte tekstvelden | `src/pages/Offertes.tsx` — interface + save + UI |
| Storage UPDATE policy | Migratie: UPDATE policy op storage.objects |

