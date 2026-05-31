
## Doel
Een gedeelde "Daklayout"-tool waarmee installateurs op de satellietfoto van een adres dakvlakken tekenen, automatisch volgepakt zien met panelen (op basis van een gekozen product uit de catalogus), en daarna individuele panelen kunnen toevoegen/verwijderen/draaien. Resultaat wordt opgeslagen op een schouw of lead en is exporteerbaar als PDF.

## Plek in platform
1. **Gedeelde component** `src/components/daklayout/DaklayoutEditor/` — herbruikbare intekencomponent (canvas op Google Maps satelliet).
2. **Standalone pagina** `src/pages/Daklayout.tsx` (route `/daklayout`) — toegankelijk vanuit Tools-menu voor installateurs.
3. **Inbedding in schouw** — knop "Daklayout intekenen" in `SchouwSatellietKaart`/`SchouwUitvoeren`, opent dezelfde editor en slaat op aan de schouw.

## UX-flow
1. Adres invoeren (autocomplete via bestaande `google-maps-config` proxy) of meegegeven vanuit schouw/lead.
2. Satellietkaart centreert + zoomt in (zoom 21, tilt 0).
3. Optioneel: "Dakgegevens ophalen" → bestaande `solar-building-insights` Edge Function vult dakvlakken automatisch voor.
4. Paneelproduct kiezen uit catalogus (dropdown gefilterd op categorie "zonnepaneel"); afmetingen (lengte × breedte mm) en Wp worden gelezen uit `products`-parameters.
5. **Dakvlak tekenen**: polygoon-tool (Google Maps Drawing Library). Per dakvlak ingeven: oriëntatie (kompas), hellingshoek, oost/west of portret/landschap, marge tot dakrand.
6. **Auto-vullen**: algoritme legt rechthoeken in de polygoon op basis van paneelmaat + oriëntatie + marge. Toont teller en geschat vermogen (aantal × Wp).
7. **Handmatig bewerken**: paneel aanklikken → verwijderen / verplaatsen / roteren. Klikken in lege ruimte → paneel toevoegen.
8. **Opslaan** → kiezen: koppelen aan schouw, lead, of standalone bewaren.
9. **PDF-export** → satellietfoto met overlay van panelen + samenvattingstabel.

## Datamodel (nieuwe tabel)
`daklayouts`:
- partner_id, gebruiker_id
- schouw_id (nullable, FK), lead_id (nullable, FK)
- adres, postcode, plaats, lat, lng
- product_id (FK products) — gekozen paneel
- paneel_breedte_mm, paneel_lengte_mm, paneel_wp (snapshot bij opslag)
- dakvlakken JSONB — array van `{ id, polygon: [{lat,lng}], orientatie, hellingshoek, modus: 'portret'|'landschap', marge_mm }`
- panelen JSONB — array van `{ id, dakvlak_id, center: {lat,lng}, rotatie_deg, status: 'auto'|'handmatig' }`
- aantal_panelen (generated), totaal_wp (generated)
- snapshot_url (PNG met overlay, in Storage bucket `daklayouts`)

RLS: standaard partner-scope via `partner_id`, installateur ziet alleen eigen layouts of die van zijn klanten (zelfde patroon als `schouwen`). GRANT's voor `authenticated` + `service_role`. Storage bucket `daklayouts` (private) met partner-scope RLS.

## Bestanden
**Nieuw:**
- `src/components/daklayout/DaklayoutEditor/index.tsx` — orchestrator (state, opslaan)
- `src/components/daklayout/DaklayoutEditor/MapCanvas.tsx` — Google Maps + drawing + paneel-overlay
- `src/components/daklayout/DaklayoutEditor/PaneelLayoutEngine.ts` — pure functie: polygoon + paneelmaat → array van paneel-centers
- `src/components/daklayout/DaklayoutEditor/PaneelProductPicker.tsx`
- `src/components/daklayout/DaklayoutEditor/DakvlakPanel.tsx` — instellingen per dakvlak
- `src/components/daklayout/DaklayoutEditor/SamenvattingKaart.tsx`
- `src/components/daklayout/useDaklayout.ts` — TanStack Query hook (CRUD)
- `src/components/daklayout/exportDaklayoutPdf.ts` — gebruikt `html2canvas` + `pdfFromElement`
- `src/pages/Daklayout.tsx` — standalone pagina
- `supabase/migrations/...sql` — tabel, RLS, GRANT, storage bucket + policies

**Aangepast:**
- `src/App.tsx` — route `/daklayout`
- `src/lib/navigation/navigationModel.ts` — menu-item onder Tools
- `src/components/schouwen/SchouwSatellietKaart.tsx` — extra knop "Daklayout intekenen"
- `src/pages/SchouwDetail.tsx` of `SchouwUitvoeren.tsx` — opslag-koppeling

## Technische details
- **Drawing**: Google Maps `drawing` library (polygoon). Panelen als `google.maps.Polygon` of `Rectangle` met fixed rotatie via geodesic projectie.
- **Layout-engine** (pure TS, unit-testbaar):
  1. Polygoon → lokale Cartesische projectie (meters) met dakvlak-centrum als origin.
  2. Roteer naar oriëntatie van dakvlak.
  3. Grid op paneelmaat + marge, behoud cellen volledig binnen polygoon (met marge tot rand).
  4. Roteer terug + reverse-projectie naar lat/lng.
- **Hellingshoek-correctie**: vlakken op het schuine dak worden in horizontale projectie iets korter; engine compenseert dimensies met `cos(helling)` op de lengte-as.
- **Snapshot voor PDF**: `html2canvas` op de kaart-container (satelliet + overlay). Gebruikt bestaand `src/lib/pdfFromElement.ts`-patroon.
- **Product-koppeling**: hook `useZonnepaneelProducten()` filtert `products` op categorie "zonnepaneel" binnen partner-scope. Afmetingen uit `parameters.afmetingen_mm` (bestaand veld).
- **Disclaimer**: standaard AI-disclaimer in UI + PDF (visuele schatting, geen vervanging voor schouw).
- **Bestandsgroottes**: respecteer 800-regels regel — split agressief.

## Niet in deze iteratie
- Schaduw-analyse (gebruik bestaande Solar API output voor zonuren).
- 3D-weergave / tilt.
- Optimalisatie van string-indeling / omvormer-keuze (kan later los).
- Embed-widget voor klanten (alleen interne tool nu; widget kan later via `widget-submit`-patroon).

## Volgorde van uitvoering
1. Migratie (tabel + RLS + storage bucket).
2. Layout-engine + unit tests.
3. MapCanvas met drawing + auto-vul.
4. Product picker + dakvlak-instellingen.
5. Save/load hook + integratie standalone pagina.
6. Schouw-integratie.
7. PDF-export.
