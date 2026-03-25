

## Plan: Energieadvies module professionaliseren

### Analyse huidige tekortkomingen

1. **Scoring begint op 50 (baseline)** — alles krijgt minimaal 50% match, zelfs producten die totaal niet passen. Er zijn te weinig criteria en geen negatieve scores.
2. **Geen klant/lead-koppeling** — advies is vluchtig, niet opgeslagen, niet koppelbaar aan een lead.
3. **Geen PDF-rapport** — consument krijgt geen tastbaar document.
4. **Beperkte advieslogica** — geen rekening met dakoriëntatie, bouwjaar, isolatie, woningtype, huishoudgrootte.
5. **Geen CO2-berekening** — concurrenten tonen CO2-besparing prominent.
6. **Product-matching mist specs** — zonnepanelen worden niet gematcht op vermogen/celtype, warmtepompen niet op verwarmingscapaciteit, laadpalen niet op vermogen/fase.

### Wijzigingen

#### 1. WizardData uitbreiden (`types.ts`)

Toevoegen aan WizardData:
- `aansluitwaarde`: 1-fase/3-fase (relevant voor laadpaal en batterij)
- `isolatieNiveau`: goed/matig/slecht (relevant voor warmtepomp-sizing)
- `heeftElektrischeAuto`: boolean (laadpaal-advies)
- `kmPerJaar`: number (laadpaal besparing)

Toevoegen aan AdviesResultaat:
- `co2BesparingKg`: number
- `zelfvoorzieningsgraad`: number (percentage)
- `prioriteit`: "hoog" | "middel" | "laag"

Toevoegen aan ProductMatch:
- `matchLabel`: "Beste keuze" | "Goede match" | "Alternatief" | "Beperkt geschikt" (ipv percentage)
- `afbeelding_url`: string | null
- `kernSpecs`: Record<string, string> (3-5 key specs voor weergave)

#### 2. Advieslogica verbeteren (`adviesLogic.ts`)

**Zonnepanelen:**
- Dakoriëntatie-factor: zuid=1.0, oost/west=0.85, oost_west=0.92, plat=0.90, noord=0.65
- Dakoppervlakte begrenzing: max panelen = dakoppervlakte / 1.7m²
- Bouwjaar check: bij bouwjaar < 1980 waarschuwing over dakconstructie
- CO2-besparing: opwekking × 0.4 kg/kWh

**Thuisbatterij:**
- Check 1-fase vs 3-fase aansluiting
- Salderingsafbouw meenemen in besparing (hogere urgentie)
- Zelfvoorzieningsgraad berekenen

**Warmtepomp:**
- Isolatieniveau meewegen: slecht → hybride aanbevelen, goed → full-electric mogelijk
- Woningtype → indicatie verwarmingscapaciteit
- Gasverbruik koken aftrekken (~50 m³)

**Laadpaal:**
- Besparing op basis van km/jaar en stroomprijs vs benzineprijs
- 1-fase vs 3-fase aanbeveling

#### 3. Productscore herziening (`adviesLogic.ts` — matchProducten)

**Nieuwe scoremethode:**
- Baseline 0 (niet 50)
- Max score 100, opgebouwd uit gewogen criteria per categorie

**Zonnepanelen scoring:**
- Vermogen match (specs.vermogen_wp vs aanbevolen Wp per paneel): +30
- Dakoriëntatie + celtype (bifacial voor plat/oost-west): +15
- Garantie ≥25 jaar vermogensgarantie: +15
- Budget match: +20
- Merkvoorkeur: +10
- Efficiency >21%: +10

**Thuisbatterij scoring:**
- Capaciteit match (bruikbare_capaciteit_kwh vs aanbevolen): +30
- Fase compatibiliteit: +15
- Noodstroom als gewenst: +10
- Cycli ≥6000: +10
- Budget: +20
- Merk: +10
- Uitbreidbaar: +5

**Warmtepomp scoring:**
- Type match (hybride/full-electric vs advies): +25
- Verwarmingscapaciteit passend bij woningtype: +20
- COP ≥ 4: +15
- Geluidsniveau < 50 dB: +10
- Subsidie (ISDE): +10
- Budget: +20

**Laadpaal scoring:**
- Laadvermogen match (11kW voor 3-fase, 7.4kW voor 1-fase): +25
- Smart charging: +15
- Load balancing: +10
- Solar charging support: +10
- Budget: +20
- Fase compatibiliteit: +10
- Connector type 2: +10

**Labels op basis van score:**
- ≥80: "Beste keuze" (groen badge)
- ≥60: "Goede match" (blauw badge)
- ≥40: "Alternatief" (grijs badge)
- <40: niet tonen

#### 4. Resultaatpagina verbeteren (`WizardStepResultaat.tsx`)

- **Samenvatting bovenaan**: Totale geschatte besparing/jaar, CO2-reductie, zelfvoorzieningsgraad
- **Advieskaarten**: Toevoegen CO2-besparing en prioriteit-badge per categorie
- **Producten**: Toon afbeelding (thumbnail), 3-5 kernspecs inline, label ipv percentage-balk
- **Lead koppelen/aanmaken**: Dialog om bestaande lead te selecteren of nieuwe lead aan te maken met consumentgegevens. Bij koppeling wordt adviesdata opgeslagen als lead_eigenschappen.
- **Offerte flow**: Bij "Offerte aanmaken" worden ook de lead-gegevens meegegeven via sessionStorage, zodat OfferteNieuw de lead automatisch koppelt.
- **PDF Rapport**: "Download adviesrapport" knop die een professionele PDF genereert met alle adviezen, besparingen, CO2-impact en aanbevolen producten.

#### 5. Stap Woning uitbreiden (`WizardStepWoning.tsx`)

- Toevoegen: Aansluiting (1-fase / 3-fase) select
- Toevoegen: Isolatieniveau (Goed / Matig / Slecht) select

#### 6. Stap Installatie uitbreiden (`WizardStepInstallatie.tsx`)

- Toevoegen: Elektrische auto toggle + km/jaar input

#### 7. Advies opslaan in database

Geen nieuwe tabel nodig — gebruik bestaande `lead_eigenschappen` (extra_json veld) om adviesresultaten op te slaan bij lead-koppeling. Bevat: wizard input, adviezen, geselecteerde producten, datum.

---

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/energieadvies/types.ts` | Uitbreiden WizardData, AdviesResultaat, ProductMatch |
| `src/components/energieadvies/adviesLogic.ts` | Volledig herziene scoring + adviesberekeningen |
| `src/components/energieadvies/WizardStepWoning.tsx` | Aansluiting + isolatieniveau velden |
| `src/components/energieadvies/WizardStepInstallatie.tsx` | Elektrische auto + km/jaar |
| `src/components/energieadvies/WizardStepResultaat.tsx` | Samenvatting, labels, kernspecs, lead-koppeling, PDF-rapport knop |
| `src/pages/Energieadvies.tsx` | Lead-koppeling state + dialog doorvoeren |

