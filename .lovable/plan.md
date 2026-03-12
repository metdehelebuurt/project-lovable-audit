

## Plan: Google Sign-in op Signup + Product UX verbeteringen

### 1. Google Sign-in op Signup pagina
**Bestand: `src/pages/Signup.tsx`**
- Voeg dezelfde Google OAuth button toe als op de login pagina
- Import `lovable` auth en `Separator`
- Plaats de Google button onder het formulier met een "of" separator
- Bij Google signup wordt de gebruiker direct ingelogd en doorgestuurd naar `/dashboard`

### 2. Geen popups in de backend — Product bewerken inline
**Bestand: `src/pages/Producten.tsx`**
- Vervang de create/edit Dialog door een **inline uitklapbaar formulier** bovenaan de pagina (of een volledige detailweergave die de tabel vervangt)
- Bij klikken op een product in de tabel: toon het bewerkformulier inline in plaats van een popup
- AI Import dialog mag blijven (is een bewuste wizard-flow), maar product CRUD wordt inline
- Klikken op een productrij opent een uitgebreide detailweergave met alle velden

### 3. Productafbeeldingen uploaden
**Bestand: `src/pages/Producten.tsx`**
- Voeg een afbeeldingen-sectie toe aan het product formulier
- Upload naar bestaande `product-images` storage bucket via Supabase Storage API
- Sla URLs op in het bestaande `afbeelding_url` (hoofdafbeelding) en `afbeeldingen` (jsonb array, extra afbeeldingen) veld
- Toon thumbnail preview in de producttabel en het formulier
- Meerdere afbeeldingen toestaan met drag-to-reorder (optioneel)

### 4. Partner-specifieke specs per product
**Bestand: `src/pages/Producten.tsx`**
- Het `specs` veld (jsonb) bestaat al — maak een UI om key-value pairs toe te voegen/bewerken
- Toon een dynamisch formulier: "Specificatie toevoegen" met naam + waarde velden
- Bestaande specs worden getoond als bewerkbare rijen
- Partners kunnen eigen specificaties invoeren die relevant zijn voor hun assortiment

### 5. Merklogo als placeholder
**Bestand: `src/pages/Producten.tsx`**
- Als `afbeelding_url` leeg is: toon een placeholder met het merklogo
- Gebruik een mapping van bekende merken naar logo URLs, of een generieke fallback met de eerste letter van het merk
- Fallback hiërarchie: `afbeelding_url` → merklogo → generiek Package icoon

### Bestanden overzicht

| Actie | Bestand |
|-------|---------|
| Edit | `src/pages/Signup.tsx` — Google sign-in button toevoegen |
| Edit | `src/pages/Producten.tsx` — Inline formulier, afbeeldingen upload, specs editor, merklogo placeholder |

### Geen database wijzigingen nodig
Alle benodigde kolommen (`afbeelding_url`, `afbeeldingen`, `specs`) en de `product-images` storage bucket bestaan al.

