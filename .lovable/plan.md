

## Plan: Webtools direct op de Tools-pagina tonen als kant-en-klare tools

### Wat verandert

De webtools worden **niet meer als losse sub-pagina** getoond, maar komen direct als individuele kaarten op de Tools-pagina te staan onder de bestaande adviestools. Elke webtool (Contactformulier, 5 calculatoren) krijgt een eigen kaart met directe actie: "Configureer & Embed". Klikken opent de configurator/embed-flow direct — geen tussenliggende pagina meer.

### Aanpak

**`src/pages/Tools.tsx`** — Uitbreiden:
- Importeer de WebTools-logica (widget state, CRUD, configurator, embed dialog) direct in Tools.tsx
- Verwijder de enkele "Webtools beheer" kaart
- Voeg onder de Adviestools sectie een "Webtools" sectie toe met 6 individuele kaarten (Contactformulier, Zonnepanelen, Warmtepomp, Isolatie, Laadpaal, Thuisbatterij)
- Per kaart: icoon, beschrijving, en twee acties:
  - Als er al een widget van dat type bestaat: "Embed code" + "Bewerken" buttons
  - Als er nog geen widget bestaat: "Configureer" button die de configurator opent met dat type voorgeselecteerd en na opslaan direct de embed code toont
- Bestaande widgets worden per type gegroepeerd op de kaart (badge "Actief"/"Inactief", embed/edit/delete)

**`src/pages/WebTools.tsx`** — Wordt overbodig, route `/tools/webtools` redirect naar `/tools` of WebTools.tsx wordt een re-export

**`src/App.tsx`** — Route `/tools/webtools` verwijderen of redirect naar `/tools`

### Technische details

- Hergebruik alle bestaande componenten: `WidgetConfigurator`, `EmbedCodeDialog`
- Fetch `web_widgets` in Tools.tsx (zelfde query als WebTools.tsx)
- Per webtool-kaart: toon hoeveel widgets er al zijn van dat type, met snelle actieknoppen
- De kaarten zijn kant-en-klaar: partner hoeft alleen naam + email in te vullen en krijgt direct de embed code

