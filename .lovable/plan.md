

## Plan: Google Solar API Integratie

### Overzicht

De Google Solar API wordt geintegreerd via een edge function (proxy) om automatisch dakgegevens op te halen, zonnepotentie-scores te berekenen, en een visuele schaduw/zonnekaart als overlay op de satellietkaart te tonen. De API key (`VITE_GOOGLE_MAPS_API_KEY`) wordt hergebruikt — dezelfde key werkt voor Maps, Geocoding en Solar API.

### Waar de API key instellen

De `VITE_GOOGLE_MAPS_API_KEY` is een **publieke** key die in de codebase wordt opgeslagen. Je moet:

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een project aan (of gebruik bestaand)
3. Schakel deze API's in: **Maps JavaScript API**, **Geocoding API**, **Solar API**
4. Ga naar "Credentials" → "Create Credentials" → "API Key"
5. Kopieer de key
6. In Lovable: ga naar de code en voeg toe aan je `.env`-achtige variabelen als `VITE_GOOGLE_MAPS_API_KEY` — of ik bouw het zo dat je de key direct in de Settings/Instellingen pagina kunt invullen

Omdat het een publieke key is, wordt deze direct in de frontend code gebruikt (al aanwezig in `SchouwSatellietKaart.tsx`).

Voor de Solar API (server-side calls) maak ik een edge function die dezelfde key of een aparte server key gebruikt. Ik sla die op als runtime secret `GOOGLE_MAPS_API_KEY`.

---

### Functies die worden gebouwd

**1. Auto-fill daksegmenten vanuit Solar API**
- Bij openen schouw voor zonnepanelen/thuisbatterij: knop "Dakgegevens ophalen"
- Roept edge function `solar-building-insights` aan met lat/lng
- Vult automatisch paneel clusters in met: oriëntatie, hellingshoek, maximaal aantal panelen, jaarlijkse zonuren per segment
- Gebruiker kan suggesties accepteren of aanpassen

**2. Zonnepotentie-score**
- Score wordt berekend uit Solar API response (max zonuren, geschikt dakoppervlak)
- Getoond als badge/meter op SchouwDetail en SchouwUitvoeren
- Score: "Uitstekend / Goed / Matig / Beperkt" met kWh-schatting

**3. Schaduw-heatmap overlay op satellietkaart**
- Solar API Data Layers endpoint levert flux/schaduw GeoTIFFs
- Edge function haalt de URL's op, frontend toont als overlay op de Google Map
- Gebruiker ziet visueel waar schaduw valt op het dak

**4. Zonnepotentie in Lead module**
- Op LeadDetail: als adres bekend, automatisch Solar API check
- Toont korte samenvatting: "Dak geschikt voor ~X panelen, ~Y kWh/jaar"

**5. Energieadvies verrijking**
- In de energieadvies wizard: Solar API data gebruiken als input voor nauwkeurigere opbrengstberekening

---

### Edge Function: `solar-building-insights`

Proxy naar `https://solar.googleapis.com/v1/buildingInsights:findClosest`

- Input: `{ lat, lng, quality? }`
- Haalt building insights op (daksegmenten, zonuren, max panelen)
- Optioneel: Data Layers URLs ophalen voor heatmap
- Return: genormaliseerde data met clusters, score, heatmap URLs

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/solar-building-insights/index.ts` | Nieuw: proxy naar Solar API |
| `src/components/schouwen/SchouwSatellietKaart.tsx` | Heatmap overlay + "Dakgegevens ophalen" knop |
| `src/components/schouwen/PaneelClusterEditor.tsx` | "Suggesties van Solar API" accept-flow |
| `src/pages/SchouwUitvoeren.tsx` | Solar API knop + score weergave integreren |
| `src/pages/SchouwDetail.tsx` | Zonnepotentie-score tonen |
| `src/pages/LeadDetail.tsx` | Solar potentie mini-check bij adres |
| `src/components/energieadvies/WizardStepWoning.tsx` | Solar data als input suggestie |
| `supabase/config.toml` | Config voor solar-building-insights |

### Runtime secret nodig

`GOOGLE_MAPS_API_KEY` — dezelfde key als de frontend, maar dan als server-side secret voor de edge function. Ik vraag deze op zodra we gaan bouwen.

