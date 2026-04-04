
## Plan: waarom "Dakgegevens ophalen" nu niet werkt in Nederland, en wat er moet gebeuren

### Do I know what the issue is?
Ja.

### Kernanalyse
Er zijn meerdere concrete oorzaken in de huidige code:

1. **Frontend forceert altijd `HIGH` kwaliteit**
   - In `src/components/schouwen/SchouwSatellietKaart.tsx` wordt de functie aangeroepen met:
     `body: { lat, lng, quality: "HIGH" }`
   - Daardoor krijgt de backend geen kans om slim terug te vallen naar lagere dekking.

2. **De fallback in de edge function is fout**
   - In `supabase/functions/solar-building-insights/index.ts` staat:
     `["HIGH", "MEDIUM", "LOW"]`
   - Volgens de officiële Google Solar documentatie is dat voor deze API **`HIGH`, `MEDIUM`, `BASE`**.
   - `LOW` is dus verkeerd.

3. **Voor EEA/Nederland moet vaak `BASE` + `EXPANDED_COVERAGE` gebruikt worden**
   - Google documentatie geeft expliciet aan dat in EEA-regio’s uitgebreide dekking via:
     `requiredQuality=BASE` + `experiments=EXPANDED_COVERAGE`
     beschikbaar kan zijn.
   - Die fallback zit nu helemaal niet in de code.

4. **De functie geeft nu een “geen data” fout terug, ook als de API technisch wel werkt**
   - De network logs tonen `200` responses vanuit de edge function met:
     “Geen zonnepotentie-data beschikbaar...”
   - Dat betekent: de functie draait, maar de gevraagde Google Solar dataset wordt voor die call niet gevonden.

5. **Er zit nog een extra bug in de data-layers code**
   - In `solar-building-insights/index.ts` wordt `qualityParam` gebruikt, maar die variabele bestaat niet.
   - Daardoor werkt de heatmap/data-layer logica nu niet goed.

6. **Nog een inconsistentie in een andere component**
   - `src/components/schouwen/SolarPotentieCheck.tsx` gebruikt nog steeds `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.
   - Dat past niet bij de gekozen proxy-aanpak via edge function en zal op andere plekken ook problemen geven.

---

## Wat dit betekent voor Nederland
De huidige implementatie is te optimistisch voor NL:
- veel adressen hebben waarschijnlijk **geen `HIGH` of `MEDIUM` dekking**
- een deel werkt mogelijk alleen met **`BASE`**
- een deel werkt mogelijk alleen met **`BASE + EXPANDED_COVERAGE`**
- sommige adressen zullen ook dán nog geen Google Solar-dekking hebben

Dus: het probleem is waarschijnlijk **niet alleen de API key**, maar vooral de **verkeerde requeststrategie voor Nederland/EEA**.

---

## Wat ik zou bouwen
### 1. Edge function robuust maken voor Nederland
`supabase/functions/solar-building-insights/index.ts`

Nieuwe volgorde:
1. `HIGH`
2. `MEDIUM`
3. `BASE`
4. `BASE + experiments=EXPANDED_COVERAGE`

De functie moet per poging:
- status en fouttype onderscheiden
- alleen “geen dekking” tonen als alle varianten falen
- teruggeven **welke quality uiteindelijk werkte**

Ook toevoegen:
- nette inputvalidatie
- duidelijke response types:
  - `success`
  - `no_coverage`
  - `api_not_enabled`
  - `invalid_request`

### 2. Frontend niet meer vastzetten op `HIGH`
`src/components/schouwen/SchouwSatellietKaart.tsx`

Aanpassen zodat:
- de frontend **geen quality meer forceert**
- de backend zelf de beste variant kiest
- de UI laat zien:
  - “Gedetailleerde data gevonden”
  - “Basisdekking gevonden”
  - “Uitgebreide dekking (experimenteel) gebruikt”
  - “Geen Google Solar dekking voor dit adres”

### 3. Data-layers/heatmap bug herstellen
In de edge function:
- `qualityParam` vervangen door de echt gebruikte quality
- data layers alleen ophalen als een geldige quality beschikbaar is
- bij expanded coverage ook correct `experiments=EXPANDED_COVERAGE` meesturen

### 4. Alle solar-componenten gelijk trekken
`src/components/schouwen/SolarPotentieCheck.tsx`

Deze component moet ook:
- niet meer afhankelijk zijn van `VITE_GOOGLE_MAPS_API_KEY`
- dezelfde proxy-/serveraanpak gebruiken
- dezelfde foutmeldingen en coverage-status tonen

### 5. Nederlandse UX verbeteren
Voor NL-specifiek gedrag:
- geocoding beperken tot Nederland waar mogelijk
- duidelijk tonen dat Google Solar-dekking **adresafhankelijk** is
- bij geen dekking:
  - satellietkaart wel tonen
  - handmatige clusterinvoer blijven toestaan
  - gebruiker niet blokkeren

---

## Hoe ik dit zou testen
Ik zou een vaste testmatrix gebruiken met Nederlandse adressen in:
- grote stad
- woonwijk
- dorp
- landelijk gebied
- nieuwbouw
- oudere wijk

Per adres controleren:
1. laad de satellietkaart?
2. lukt geocoding?
3. welke Solar quality werkt?
4. komen dakvlakken/clusters terug?
5. werkt scoreweergave?
6. wordt “geen dekking” correct getoond als niets beschikbaar is?

Belangrijk:
- het doel moet niet zijn dat **elk** Nederlands adres werkt
- het doel moet zijn dat:
  - adressen mét Google Solar-dekking goed werken
  - adressen zónder dekking correct en duidelijk worden afgehandeld

---

## Verwachte uitkomst na deze fix
Na implementatie verwacht ik:
- “Dakgegevens ophalen” werkt voor Nederlandse adressen waar Google Solar data beschikbaar is
- veel meer succes dan nu door `BASE` en `EXPANDED_COVERAGE`
- correcte fallback als er geen dekking is
- geen foutieve generieke melding “Solar API niet beschikbaar” terwijl de API eigenlijk wel werkt
- consistente werking in zowel schouw als detail/lead checks

---

## Technische details
### Bestanden
- `supabase/functions/solar-building-insights/index.ts`
- `src/components/schouwen/SchouwSatellietKaart.tsx`
- `src/components/schouwen/SolarPotentieCheck.tsx`

### Concrete fixes
- `LOW` vervangen door `BASE`
- frontend `quality: "HIGH"` verwijderen
- fallback toevoegen met `experiments=EXPANDED_COVERAGE`
- `qualityParam` bug oplossen
- response uitbreiden met metadata zoals:
  - `usedQuality`
  - `coverageMode`
  - `limitations`
  - `hasRoofSegments`

### Belangrijke nuance
Google Solar API is in Nederland niet hetzelfde als volledige gegarandeerde dekking op elk adres. Zelfs met een correcte implementatie zullen sommige adressen geen data hebben. De app moet dat daarom functioneel opvangen in plaats van dit als technische fout te behandelen.
