

## Plan: Uitbreiding Schouw Module — Thuisbatterij, Zonnepanelen Clusters & Google Maps

### Overzicht

Drie uitbreidingen: (1) thuisbatterij-schouw drastisch uitbreiden met wensen, off-grid vereisten en omvormerdetails, (2) zonnepanelen-schouw uitbreiden met meerdere dakcluster-registratie en gedetailleerdere gegevens, (3) Google Maps satellietweergave integreren voor visuele inspectie.

---

### 1. Zonnepanelen: Meerdere clusters + extra gegevens

**Probleem**: Nu kan slechts één dak/oriëntatie worden vastgelegd. In de praktijk hebben woningen meerdere dakvlakken met panelen.

**Oplossing**: In `SchouwUitvoeren.tsx` een "Paneel clusters" sectie toevoegen in stap 0 (technische inspectie) voor de categorie `zonnepanelen` en `thuisbatterij`. Clusters worden opgeslagen als array in het `gegevens` JSON-veld.

Per cluster:
- Dakvlak naam (bijv. "Zuid-dak", "Oost-dak")
- Oriëntatie (dropdown: N/NO/O/ZO/Z/ZW/W/NW)
- Hellingshoek (°)
- Aantal panelen op dit vlak
- Vermogen per paneel (Wp)
- Schaduw (geen/licht/matig/veel)
- Schaduwbron (tekst)
- Daktype (schuin/plat)

**Extra velden in `SchouwCategoryFields.ts` voor zonnepanelen**:
- Installatie jaar
- Omvormer merk + model
- Omvormer vermogen (kW)
- Omvormer type (string/micro/optimizers)
- Serienummer omvormer
- Monitoring aanwezig (ja/nee)
- Opmerkingen installatie (tekst)

### 2. Thuisbatterij schouw: Gedetailleerde wensen & off-grid

**Uitbreiding `SchouwCategoryFields.ts` — thuisbatterij categorie**:

Nieuwe secties:

**"Huidige zonnepanelen"** (vervangt huidige beperkte velden):
- Installatie jaar
- Omvormer merk + model
- Omvormer vermogen (kW)
- Omvormer type (string/micro/hybride)
- Hybride omvormer (ja/nee) — belangrijk voor batterij-compatibiliteit
- Jaarlijks verbruik (kWh)
- Jaarlijkse teruglevering (kWh)
- Energiecontract type (vast/dynamisch)
- Clusters referentie (link naar paneel-clusters)

**"Wensen & verwachtingen"** (nieuw):
- Primaire motivatie (multi-select: zelfconsumptie / piekshaving / noodstroom / dynamisch laden / off-grid)
- Gewenste capaciteit (kWh) of automatisch
- Budget indicatie min/max
- Merkvoorkeur
- Prioriteit: besparing vs. onafhankelijkheid

**"Off-grid vereisten"** (nieuw, conditioneel bij motivatie = off-grid):
- Volledige off-grid gewenst (ja/nee)
- Essentiële apparaten bij stroomuitval (tekst)
- Geschat noodstroomverbruik (kWh/dag)
- Gewenste autonomie (uren/dagen)
- Generator aanwezig als backup (ja/nee)
- Vereiste omvormer: hybride met eilandbedrijf
- 3-fase netaansluiting nodig bij off-grid (ja/nee)

**"Omvormer compatibiliteit"** (nieuw):
- Huidige omvormer compatibel met batterij (ja/nee/onbekend)
- Omvormer vervanging nodig (ja/nee)
- Gewenst omvormertype bij vervanging (hybride/AC-gekoppeld)

**Uitbreiding checklist** (`SchouwChecklists.ts` — thuisbatterij):
- Omvormer compatibiliteit gecontroleerd (required)
- Off-grid vereisten besproken
- Noodstroomscenario doorgenomen
- Teruglevering bij netbeheerder gecontroleerd
- Ventilatie batterijruimte gecontroleerd
- Brandveiligheid locatie beoordeeld

### 3. Google Maps Satellietweergave

**Nieuw component: `src/components/schouwen/SchouwSatellietKaart.tsx`**

- Gebruikt Google Maps JavaScript API met satellite view
- Input: adres van de lead/consument (uit schouw data)
- Geocoding van adres naar coördinaten
- Satellite tile layer met hoog zoomniveau
- Marker op de woning
- Gebruiker kan visueel panelen zien op het dak
- Screenshot-knop (optioneel, via html2canvas) om satellietbeeld op te slaan als foto in het schouw-dossier

**Integratie**: In `SchouwUitvoeren.tsx` als extra sectie in stap 0 bij categorie `zonnepanelen` en `thuisbatterij`.

**Secret nodig**: `GOOGLE_MAPS_API_KEY` — publieke key, kan in codebase als `VITE_GOOGLE_MAPS_API_KEY`.

### 4. Cluster UI component

**Nieuw component: `src/components/schouwen/PaneelClusterEditor.tsx`**

- Dynamisch clusters toevoegen/verwijderen
- Per cluster een card met alle velden
- Data opgeslagen als `gegevens.paneel_clusters` (JSON array)
- Gebruikt in `SchouwUitvoeren.tsx` stap 0

---

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/schouwen/SchouwCategoryFields.ts` | Zonnepanelen + thuisbatterij velden fors uitbreiden |
| `src/components/schouwen/SchouwChecklists.ts` | Thuisbatterij checklist uitbreiden |
| `src/components/schouwen/PaneelClusterEditor.tsx` | Nieuw: meerdere dakcluster UI |
| `src/components/schouwen/SchouwSatellietKaart.tsx` | Nieuw: Google Maps satellite component |
| `src/pages/SchouwUitvoeren.tsx` | Cluster-editor en satellietkaart integreren in stap 0 |
| `src/pages/SchouwDetail.tsx` | Clusters en satellietkaart tonen in detail view |

