

## Fase 4: Schouw Wizard, Energieadvies & Product Statistieken

### 1. Stapsgewijze Schouw Wizard
Het huidige schouw-formulier toont alle velden op één pagina. Omzetten naar een wizard met stappen:

- **Stap 1:** Lead selecteren + categorie kiezen + datum
- **Stap 2:** Categorie-specifieke velden (daktype, isolatie, etc.)
- **Stap 3:** Notities + samenvatting + opslaan

Implementatie: Een `SchouwWizard` component met `currentStep` state, voortgangsbalk (Progress), en Volgende/Vorige knoppen. Vervangt het huidige platte formulier in de Dialog.

**Bestand:** `src/pages/Schouwen.tsx` — Dialog content refactoren naar wizard-stijl

### 2. Energieadvies View
Nieuwe pagina `/energieadvies` met een thuisbatterij-combinatie advies tool:
- Gebruiker vult in: zonnepanelen vermogen, jaarverbruik, teruglevering, dynamisch contract
- Berekening: aanbevolen batterijcapaciteit, geschatte besparing, terugverdientijd
- Configureerbare adviesregels (simpele constanten in code, later door superadmin)

**Bestanden:**
- `src/pages/Energieadvies.tsx` — Nieuwe pagina
- `src/App.tsx` — Route toevoegen
- `src/components/AppSidebar.tsx` — Menu-item voor adviseur/partner_admin

### 3. Product Statistieken
Toevoegen aan de Producten pagina: een statistieken-sectie bovenaan met:
- Totaal producten, actief, uitgefaseerd
- Meest verkochte producten (uit offerte regels)
- Totale cataloguswaarde

**Bestand:** `src/pages/Producten.tsx` — Statistieken cards toevoegen

### Bestanden overzicht

| Actie | Bestand |
|-------|---------|
| Edit | `src/pages/Schouwen.tsx` |
| Create | `src/pages/Energieadvies.tsx` |
| Edit | `src/pages/Producten.tsx` |
| Edit | `src/App.tsx` |
| Edit | `src/components/AppSidebar.tsx` |

