

## Plan: Hero afbeelding, AI Product Import & Installateur Producten

### 1. Hero afbeelding in WebP formaat
De huidige hero gebruikt een Unsplash JPG. Vervangen door een passende verduurzamings-afbeelding in WebP formaat (zonnepanelen op dak). Unsplash ondersteunt `&fm=webp` parameter.

**Bestand:** `src/components/website/HeroSection.tsx` — URL aanpassen naar WebP formaat met relevante afbeelding (bijv. zonnepanelen installatie).

### 2. AI Product Import via Edge Function
Een edge function `ai-product-import` die via Lovable AI (Gemini) het productassortiment van een merk ophaalt per categorie, inclusief specs. Gebruikt tool calling voor gestructureerde output.

**Flow:**
1. Gebruiker kiest merk + categorie in een dialog
2. Edge function stuurt prompt naar Lovable AI: "Geef alle producten van [merk] in categorie [categorie] met specs"
3. AI retourneert gestructureerde data via tool calling (naam, model, specs, prijs indicatie, etc.)
4. Gebruiker ziet preview van gevonden producten en kan selecteren welke te importeren
5. Geselecteerde producten worden ingevoegd in de `producten` tabel

**Bestanden:**
- `supabase/functions/ai-product-import/index.ts` — Edge function met Lovable AI
- `supabase/config.toml` — functie registreren met `verify_jwt = false`
- `src/pages/Producten.tsx` — AI Import dialog + preview + import flow

### 3. Installateur toegang tot Producten
Momenteel kunnen alleen `superadmin` en `partner_admin` producten beheren. Uitbreiden:

- **RLS policies:** INSERT policy toevoegen voor `installateur` rol (met eigen partner_id)
- **Sidebar:** "Producten" toevoegen aan installateur navigatie
- **UI:** `canEdit` check uitbreiden met `installateur` rol
- **Scope:** Installateur kan alleen eigen producten (partner_id = eigen partner) aanmaken/bewerken

**Database migratie:** RLS policies voor INSERT/UPDATE op producten uitbreiden voor installateur rol.

**Bestanden overzicht:**

| Actie | Bestand |
|-------|---------|
| Edit | `src/components/website/HeroSection.tsx` |
| Create | `supabase/functions/ai-product-import/index.ts` |
| Edit | `src/pages/Producten.tsx` |
| Edit | `src/components/AppSidebar.tsx` |
| Edit | `src/App.tsx` (route toestaan voor installateur) |
| Migration | RLS policies producten uitbreiden voor installateur |

### Technische Details

**AI Product Import edge function:**
- Model: `google/gemini-3-flash-preview` (snel, goed voor gestructureerde data)
- Tool calling met `import_products` function schema voor gestructureerde output
- Retourneert array van producten met: naam, model, merk, categorie, omschrijving, specs (vermogen, gewicht, afmetingen, etc.), prijs indicatie, garantie, certificeringen
- Rate limit/402 error handling

**Installateur RLS:**
- INSERT: `(get_user_role(auth.uid()) = 'installateur') AND (partner_id = get_user_partner_id(auth.uid()))`
- UPDATE: zelfde check, alleen eigen producten
- Bestaande SELECT policy dekt al partner-producten

