

## Plan: Producten detailpagina, belafspraken, lead→klant fix & specificatie-PDF fix

### Overzicht
Dit plan pakt 6 problemen/wensen aan:
1. **Producten eigen detailpagina** met tabs (overzicht, specificaties, datasheet, AI)
2. **Specificaties duidelijker overzicht** in een tabel met groepen
3. **Specificatie-PDF fix** — specs komen niet mee in de PDF, fix de flow
4. **Belafspraken** als nieuw afspraaktype + weergave in planning
5. **Lead→klant conversie** werkt al in offerte-accept, maar controleren en verbeteren
6. **AI specificatie-controle** direct vanuit productpagina

---

### 1. Nieuwe productdetailpagina (`/producten/:id`)

Nieuwe pagina `src/pages/ProductDetail.tsx` met een modern tabbed layout:

| Tab | Inhoud |
|-----|--------|
| **Overzicht** | Productafbeelding, basisgegevens (naam, merk, model, categorie, status), prijs, omschrijving, offerte-tekst |
| **Specificaties** | Gegroepeerde specificatie-tabel per categorie (accordions), met labels en eenheden uit `categorySpecDefinitions.ts`. Read-only weergave met edit-toggle |
| **Datasheet** | Preview/download van gegenereerde of geüploade datasheet-PDF. Knop om te genereren of uploaden. Direct PDF download link |
| **AI Controle** | Knop "Specificaties controleren & aanvullen met AI" — roept `ai-verify-product-specs` aan en toont resultaat met diff |

Navigatie: klikken op product in de tabel → `/producten/:id` (niet meer inline edit). Bewerk-knop op detailpagina opent edit-dialog of inline editing.

### 2. Specificaties duidelijker

Op de productdetailpagina, tab "Specificaties":
- Toon specs gegroepeerd per groep (Elektrisch, Fysiek, Connectiviteit, etc.) uit `categorySpecDefinitions.ts`
- Elke groep als een sectie met header
- Twee-koloms tabel met label + waarde + eenheid
- Lege specs verborgen in read-only, zichtbaar in edit-mode
- Visueel onderscheid: gevulde vs lege specs

### 3. Specificatie-PDF fix

Het probleem: `ProductDatasheetSection` genereert specs via AI en slaat ze op, maar de `ProductDatasheet` component leest `product.specs` en `product.installatie_specs`. De AI retourneert `corrected_specs` + `installatie_specs` apart, maar bij opslaan worden ze samengevoegd in één `specs` object. De PDF toont dan niets onder `installatie_specs` omdat dat veld niet bestaat op het product.

Fix:
- In `ProductDatasheetSection.handleGenerate`: bewaar `installatie_specs` apart in het enriched product object (dit werkt al lokaal)
- In de nieuwe productdetailpagina: pass `installatie_specs` correct door bij PDF preview
- Verbeter de `ProductDatasheet` component: als er geen aparte `installatie_specs` zijn, groepeer dan specs automatisch op basis van de `categorySpecDefinitions` groepen

### 4. Belafspraken

Uitbreiden van het `type` veld in de `afspraken` tabel:
- Huidige waarden: `thuisbezoek`, `op_afstand`
- Toevoegen: `belafspraak`

Wijzigingen:
- `AfspraakDialog.tsx`: voeg "Belafspraak" (📞) toe als derde type-optie
- `Planning.tsx`: belafspraken tonen met eigen icoon (Phone) en kleur
- `planning-ical-feed`: belafspraken meenemen in de feed

### 5. Lead→klant conversie verificatie

De `offerte-accept` edge function maakt al een klant aan. Controleer:
- Of de klant correct wordt aangemaakt met alle velden
- Of `lead_status` wordt bijgewerkt naar `'klant'`
- Dit werkt al correct in de code — geen wijzigingen nodig hier

### 6. Direct PDF download

Op de productdetailpagina, tab "Datasheet":
- Als `datasheet_type === "fabrikant"`: directe download-link naar de PDF
- Als `datasheet_type === "gegenereerd"`: knop die `window.print()` triggert voor de preview, of een "Open als PDF" knop

---

### Bestanden

| Bestand | Actie |
|---------|-------|
| `src/pages/ProductDetail.tsx` | **Nieuw** — volledige productdetailpagina met tabs |
| `src/App.tsx` | Route toevoegen: `/producten/:id` |
| `src/pages/Producten.tsx` | Klik op product → `navigate(/producten/${id})` i.p.v. inline edit |
| `src/components/shared/AfspraakDialog.tsx` | Type "belafspraak" toevoegen |
| `src/pages/Planning.tsx` | Belafspraken icoon (Phone) en kleur toevoegen |
| `src/components/producten/ProductDatasheet.tsx` | Fix: auto-groepering specs als geen aparte installatie_specs |
| `supabase/functions/planning-ical-feed/index.ts` | Belafspraken type meenemen |

