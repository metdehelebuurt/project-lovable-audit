

## Plan: Offerte-creatie verbeteren + Tools module met Thuisbatterij Selector

### Overzicht
Drie grote wijzigingen:
1. **Offerte aanmaken**: Vervang popup-dialog door een volledige inline pagina, met ajax lead-zoeker en optie om direct een nieuwe lead aan te maken
2. **Tools module**: Nieuw menu-item "Tools" met submenu dat Energieadvies en Thuisbatterij Selector bevat
3. **Thuisbatterij Selector**: Nieuwe wizard-tool specifiek voor batterijselectie op basis van klantsituatie, met directe offerte-creatie

---

### 1. Offerte aanmaken — van Dialog naar volledige pagina

**Nieuw bestand: `src/pages/OfferteNieuw.tsx`**
- Volledige pagina (geen popup) met dezelfde formulierlogica als de huidige dialog
- **Lead koppeling** sectie bovenaan met twee tabs:
  - **"Bestaande lead"**: Ajax-zoekveld (debounced input, queryt `leads` tabel op naam/email) met dropdown resultaten — geen volledige lijst laden
  - **"Nieuwe lead"**: Inline formulier met voornaam, achternaam, email, telefoon, adres, postcode, plaats. Maakt direct een lead aan bij submit en koppelt deze
- Bij selectie van bestaande lead: autofill klantgegevens (zoals nu)
- Behoudt prefill via sessionStorage voor energieadvies-flow
- Route: `/offertes/nieuw`

**Wijzigingen `src/pages/Offertes.tsx`:**
- "Nieuwe Offerte" button navigeert naar `/offertes/nieuw` i.p.v. dialog openen
- Verwijder create-dialog logica (behoud edit-dialog voor bestaande offertes)
- useEffect voor `nieuw=1` redirect naar `/offertes/nieuw` met sessionStorage data

**Wijzigingen `src/App.tsx`:**
- Voeg route `/offertes/nieuw` toe naar `OfferteNieuw`

---

### 2. Tools module

**Wijzigingen `src/components/AppSidebar.tsx`:**
- Vervang los "Energieadvies" menu-item door een **"Tools"** groep met sub-items:
  - Energieadvies (`/tools/energieadvies`)
  - Thuisbatterij Selector (`/tools/thuisbatterij`)
- Icoon: `Wrench` of `Package` voor de groep

**Nieuw bestand: `src/pages/Tools.tsx`**
- Landingspagina met kaarten voor elke tool (Energieadvies, Thuisbatterij Selector)
- Elke kaart linkt door naar de specifieke tool

**Wijzigingen `src/App.tsx`:**
- Routes aanpassen: `/energieadvies` → `/tools/energieadvies`, plus `/tools` en `/tools/thuisbatterij`

---

### 3. Thuisbatterij Selector

**Nieuw bestand: `src/pages/ThuisbatterijSelector.tsx`**
- Compacte 3-staps wizard:
  1. **Situatie**: Heeft klant zonnepanelen? Welk vermogen (Wp)? Leeftijd? Heeft dynamisch contract? Jaarverbruik kWh? Teruglevering?
  2. **Wensen**: Budget range, merkvoorkeur, gewenste capaciteit (of automatisch), motivatie (zelfconsumptie, piekshaving, noodstroom)
  3. **Resultaat**: Berekent ideale capaciteit, toont gesorteerde productmatches uit partner-producten (categorie=thuisbatterij), met geschiktheidsscore

- **Berekening** (hergebruikt en verdiept vanuit `adviesLogic.ts`):
  - Berekent dagelijks overschot op basis van Wp en verbruik
  - Adviseert capaciteit (kWh) op basis van overschot + dynamisch contract bonus
  - Matcht op specs.capaciteit_kwh, budget, merk, garantie
  - Extra scoring: compatibiliteit met bestaande omvormer, fasetype, noodstroomcapabiliteit

- **Offerte-integratie**: Adviseur kan product selecteren → "Maak offerte" knop die via sessionStorage + navigate naar `/offertes/nieuw` gaat

- **Klantgegevens**: Optioneel veld bovenaan om lead te koppelen (zelfde ajax-search component), zodat bij offerte-creatie de klantdata al is ingevuld

**Nieuw bestand: `src/components/thuisbatterij/BatterijLogic.ts`**
- Functies voor capaciteitsberekening en productmatching specifiek voor thuisbatterijen

**Nieuw bestand: `src/components/shared/LeadSearchInput.tsx`**
- Herbruikbaar ajax-zoekcomponent voor leads (gebruikt door zowel OfferteNieuw als ThuisbatterijSelector)
- Debounced search, toont naam + email + plaats in dropdown
- Optie "Nieuwe lead toevoegen" onderaan resultaten

---

### Bestanden overzicht

| Actie | Bestand |
|-------|---------|
| Nieuw | `src/pages/OfferteNieuw.tsx` — Volledige pagina voor offerte aanmaken |
| Nieuw | `src/pages/Tools.tsx` — Tools overzichtspagina |
| Nieuw | `src/pages/ThuisbatterijSelector.tsx` — Thuisbatterij selector wizard |
| Nieuw | `src/components/shared/LeadSearchInput.tsx` — Herbruikbaar lead-zoekcomponent |
| Nieuw | `src/components/thuisbatterij/BatterijLogic.ts` — Batterij berekeningen |
| Edit | `src/pages/Offertes.tsx` — Verwijder create-dialog, navigeer naar /offertes/nieuw |
| Edit | `src/components/AppSidebar.tsx` — Tools groep met sub-items |
| Edit | `src/App.tsx` — Nieuwe routes toevoegen |

### Geen database wijzigingen nodig
De bestaande `leads` en `producten` tabellen volstaan. Lead-aanmaak gebruikt de bestaande RLS policies.

