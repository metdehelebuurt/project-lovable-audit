

## Plan: Offerte Template Customization, Lead Detail, AI Koopsignalen

### Gevonden problemen & kansen

1. **Energieadvies ontbreekt in PDF**: De berekening vereist `schouw.gegevens.zonnepanelen_wp` en `jaarverbruik` — als die niet ingevuld zijn, toont de PDF niets. Daarnaast werkt het alleen voor batterij-berekeningen, niet voor andere categorieën.
2. **Opslaan opent printerscherm**: Er is maar één knop ("PDF downloaden / Afdrukken") die `window.print()` aanroept.
3. **Geen lead detail pagina**: Leads tabel heeft alleen inline edit, geen klikbare detailpagina.
4. **Geen offerte template customization**: Partners kunnen alleen logo/kleuren/slogan instellen, niet de inhoud/structuur van de PDF.

### Wat wordt gebouwd

**1. Lead Detail Pagina (`src/pages/LeadDetail.tsx`)**
- Nieuwe route `/leads/:id` — klikken op lead in tabel navigeert hier naartoe
- Bovenaan: lead contactinfo card met inline-edit van status (pipeline stappen visueel als stepper)
- Tabbladen: **Overzicht** (contactinfo, bron, notities), **Offertes** (lijst gekoppelde offertes + "Nieuwe offerte" knop), **Schouwen** (gekoppelde schouwen + "Nieuwe schouw" knop), **Activiteit** (tijdlijn van statuswijzigingen)
- **AI Koopsignalen panel**: Zijpaneel/card dat via een edge function (Lovable AI) de lead analyseert op basis van status, bron, offertes, schouwgegevens en commerciële tips geeft

**2. AI Koopsignalen Edge Function (`supabase/functions/ai-lead-signals/index.ts`)**
- Ontvangt lead_id, haalt lead + offertes + schouwen op via service role
- Stuurt naar Lovable AI (gemini-3-flash-preview) met systeem prompt: "Je bent een commercieel adviseur voor duurzame energie. Analyseer deze lead en geef 3-5 concrete koopsignalen en adviezen."
- Retourneert gestructureerde JSON (signals array met titel, beschrijving, prioriteit)

**3. Offerte Template Instellingen (uitbreiding `src/pages/Instellingen.tsx`)**
- Nieuw tabblad/card "Offerte templates" voor partner_admin
- Configureerbare opties:
  - **Voorblad aan/uit** + eigen introductietekst template
  - **Productpagina aan/uit**
  - **Energieadvies pagina aan/uit**  
  - **Schouwrapport aan/uit**
  - **Standaard garantievoorwaarden** (tekst)
  - **Standaard betalingsvoorwaarden** (tekst)
  - **Standaard installatietermijn** (tekst)
  - **Footer badges** (aanpasbare teksten voor de 3 badges op voorblad)
  - **Akkoordsectie tekst** (aanpasbaar)
- Opgeslagen in `partners.feature_flags_json` (bestaand JSONB veld) onder key `offerte_template`

**4. OffertePDFPreview fixes**
- **Energieadvies fix**: Als `include_energieadvies` aan staat maar er geen schouw-gebaseerde berekening mogelijk is, toon een generieke energieadvies sectie op basis van de producten in de offerte (categorie-specifiek)
- **Split Opslaan/Afdrukken**: Twee knoppen — "PDF downloaden" (window.print) en "Terug naar offerte" (window.history.back)
- **Template-aware rendering**: Lees partner template settings uit en toon/verberg pagina's op basis van config

**5. Leads pagina uitbreiden**
- Klikbare rijnaam navigeert naar `/leads/:id`
- Snelknoppen in tabel: "Offerte maken" en "Schouw plannen" links per lead

**6. Routes & navigatie**
- Nieuwe route `/leads/:id` met LeadDetail component
- Allowedroles: superadmin, partner_admin, partner_staff, adviseur

### Database wijzigingen
Geen schema-wijzigingen nodig — template config wordt opgeslagen in het bestaande `partners.feature_flags_json` JSONB veld.

### Edge function
- `supabase/functions/ai-lead-signals/index.ts` — nieuwe functie
- Gebruikt `LOVABLE_API_KEY` (al beschikbaar) en `SUPABASE_SERVICE_ROLE_KEY`

### Bestanden die wijzigen/nieuw
| Bestand | Actie |
|---------|-------|
| `src/pages/LeadDetail.tsx` | **Nieuw** — Lead detail met tabs, pipeline, AI signals |
| `supabase/functions/ai-lead-signals/index.ts` | **Nieuw** — AI koopsignalen |
| `src/pages/Leads.tsx` | Klikbare rijen + snelknoppen |
| `src/pages/Instellingen.tsx` | Offerte template configuratie card |
| `src/components/OffertePDFPreview.tsx` | Energieadvies fix, split knoppen, template-aware |
| `src/App.tsx` | Route `/leads/:id` toevoegen |
| `supabase/config.toml` | ai-lead-signals function registreren |

### Volgorde
1. Lead detail pagina + route
2. AI koopsignalen edge function
3. Offerte template instellingen
4. OffertePDFPreview fixes (energieadvies, knoppen, template)
5. Leads pagina aanpassingen

