

## Plan: Import/Export functie voor Producten, Leads en Offertes

### Overzicht
Universele import/export module met AI-gestuurde import (elk formaat wordt automatisch herkend) en CSV-export. Partners zien alleen eigen data.

---

### Nieuwe bestanden

**1. `src/components/shared/ImportExportButtons.tsx`**
- Herbruikbare component met "Importeren" en "Exporteren" knoppen
- Export: ontvangt data als prop, genereert CSV in browser en triggert download
- Import: opent ImportDialog

**2. `src/components/shared/ImportDialog.tsx`**
- Drag & drop zone + file input (.csv, .json, .txt, .xlsx)
- Leest bestand als tekst (voor xlsx: client-side parsing met `read-excel-file` package — lightweight, geen SheetJS nodig)
- Stuurt ruwe tekst + entity_type naar edge function met `action: "preview"`
- Toont preview-tabel met gemapte data en eventuele warnings
- Checkbox per rij om te deselecteren
- Bevestig-knop stuurt geselecteerde records naar edge function met `action: "confirm"`
- Toast bij succes/fout, sluit dialog en invalidate queries

**3. `supabase/functions/ai-data-import/index.ts`**
- Twee acties: `preview` en `confirm`
- **Preview flow:**
  - Authenticatie via getClaims, haal partner_id op via service role
  - Stuur raw_data naar Lovable AI (`google/gemini-3-flash-preview`) met tool calling
  - Systeemprompt bevat exact schema per entity_type (producten/leads/offertes)
  - Tool calling retourneert gestructureerde array met gemapte velden
  - Validatie: verplichte velden, prijsformat, duplicaatdetectie tegen bestaande data
  - Retourneer preview records met warnings
- **Confirm flow:**
  - Ontvang gevalideerde records array
  - Bulk insert via adminClient (service role) met partner_id van de ingelogde gebruiker
  - Voor leads: zet `owner_user_id` op de ingelogde gebruiker
  - Retourneer aantal geïmporteerde records

---

### Wijzigingen bestaande bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Producten.tsx` | ImportExportButtons toevoegen in header naast bestaande knoppen |
| `src/pages/Leads.tsx` | ImportExportButtons toevoegen in header |
| `src/pages/Offertes.tsx` | Alleen Export knop (import te complex door regels/berekeningen) |
| `supabase/config.toml` | `[functions.ai-data-import]` met `verify_jwt = false` toevoegen |

---

### Beveiliging
- Edge function valideert JWT via getClaims en haalt partner_id op uit users tabel
- Insert via service role maar altijd met de partner_id van de ingelogde gebruiker
- Export gebruikt bestaande RLS-gefilterde queries — partners zien alleen eigen data

### Geen database migraties nodig
Alle tabellen bestaan al. De edge function insert via service role met expliciete partner_id.

### NPM package toevoegen
- `read-excel-file` — lightweight xlsx parser voor client-side Excel reading (~30KB)

