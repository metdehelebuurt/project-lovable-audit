

## Plan: Energieadvies module uitbreiden met wizard, productmatching en offerte-integratie

### Huidige situatie
De Energieadvies pagina is een simpele calculator met 4 velden (zonnepanelen Wp, jaarverbruik, teruglevering, dynamisch contract) die alleen thuisbatterij-advies geeft. Geen koppeling met producten of offertes.

### Doel
Een stapsgewijze advieswizard die de wensen van de consument inventariseert, passende producten matcht uit de catalogus, en adviseurs in staat stelt direct een offerte te genereren vanuit het adviesresultaat.

### Aanpak

**Stap 1: Multi-step wizard** — Vervang de huidige simpele calculator door een wizard met 5 stappen:

1. **Woningsituatie** — Type woning, bouwjaar, dakoriëntatie, oppervlakte, aantal personen, huidig energielabel
2. **Huidige installatie** — Heeft al zonnepanelen? Vermogen (Wp), type omvormer, leeftijd. Heeft al warmtepomp/laadpaal?
3. **Verbruik & energiecontract** — Jaarverbruik (kWh), gasverbruik (m³), huidige teruglevering, type contract (vast/dynamisch), maandelijkse energiekosten
4. **Wensen & budget** — Interesse in welke categorieën (zonnepanelen, thuisbatterij, warmtepomp, laadpaal), budget range, merkvoorkeur (vrij tekstveld), belangrijkste motivatie (kostenbesparing / duurzaamheid / onafhankelijkheid / waardestijging woning)
5. **Resultaat & productadvies** — Berekend advies per geselecteerde categorie + automatisch gematchte producten uit de catalogus, gesorteerd op geschiktheid

**Stap 2: Productmatching** — Op basis van de wizard-antwoorden:
- Filter producten op geselecteerde categorieën en status=actief
- Filter op merkvoorkeur (als opgegeven)
- Sorteer op prijs binnen budget, toon ook opties net boven budget
- Toon per product: naam, merk, prijs, specs, garantie, een "geschiktheids-score" indicator

**Stap 3: Adviseur quick-actions** — Als de ingelogde gebruiker een adviseur/partner_admin/partner_staff is:
- Toon een "Selecteer producten" stap na het resultaat
- Checkboxes op producten + aantal instellen
- Knop "Offerte aanmaken" die navigeert naar `/offertes` met pre-filled regels (via URL searchParams of sessionStorage)
- Klantgegevens worden ook meegegeven als ze beschikbaar zijn (via lead koppeling)

### Bestanden

| Actie | Bestand |
|-------|---------|
| Rewrite | `src/pages/Energieadvies.tsx` — Complete wizard met stappen, productmatching, offerte-integratie |
| Edit | `src/pages/Offertes.tsx` — Lees pre-filled data uit sessionStorage bij openen nieuw formulier |

### Geen database wijzigingen nodig
Alle wizard-data is client-side state. Producten worden gelezen uit bestaande `producten` tabel. Offerte wordt aangemaakt via bestaande flow.

### Technische details

- Wizard state management via `useState` met een `step` counter (0-4, of 0-5 voor adviseurs)
- Producten ophalen via `useQuery` op `producten` tabel, gefilterd op actief
- Progress indicator boven de wizard (stappen balk)
- Berekeningen uitgebreid: naast thuisbatterij-advies ook zonnepanelen-advies (geschat vermogen obv verbruik), warmtepomp-indicatie (obv gasverbruik), laadpaal-indicatie
- Offerte pre-fill: adviseur selecteert producten → `sessionStorage.setItem('offerte-prefill', JSON.stringify({...}))` → `navigate('/offertes?nieuw=1')` → Offertes leest dit uit en opent dialog met data

