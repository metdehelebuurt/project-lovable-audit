// =====================================================================
// AUTO-GENERATED — DO NOT EDIT
// Bron: src/lib/tour/anchors.ts + scripts/generate-tour-knowledge.ts
// =====================================================================

export interface TourAnchor {
  id: string;
  label: string;
  route: string;
  moduleKey: string | null;
  omschrijving: string;
}

export const TOUR_ANCHORS: TourAnchor[] = [
  {
    "id": "app:zoeken",
    "label": "Zoeken",
    "route": "*",
    "moduleKey": null,
    "omschrijving": "Globale zoekbalk / command palette in de header."
  },
  {
    "id": "app:notificaties",
    "label": "Notificaties",
    "route": "*",
    "moduleKey": null,
    "omschrijving": "Meldingenpaneel in de header."
  },
  {
    "id": "app:profielmenu",
    "label": "Profielmenu",
    "route": "*",
    "moduleKey": null,
    "omschrijving": "Menu rechtsboven met profiel, instellingen en uitloggen."
  },
  {
    "id": "app:hulp",
    "label": "Hulp nodig",
    "route": "*",
    "moduleKey": null,
    "omschrijving": "Knop die de AI-hulpassistent opent."
  },
  {
    "id": "leads:nieuw",
    "label": "Nieuwe lead",
    "route": "/leads",
    "moduleKey": "leads",
    "omschrijving": "Knop om een nieuwe lead aan te maken."
  },
  {
    "id": "leads:zoek",
    "label": "Leads zoeken",
    "route": "/leads",
    "moduleKey": "leads",
    "omschrijving": "Zoekveld binnen de leadlijst."
  },
  {
    "id": "leads:weergave",
    "label": "Weergave leads",
    "route": "/leads",
    "moduleKey": "leads",
    "omschrijving": "Wissel tussen lijst- en Kanban-weergave."
  },
  {
    "id": "klanten:nieuw",
    "label": "Nieuwe klant",
    "route": "/klanten",
    "moduleKey": "klanten",
    "omschrijving": "Knop om een klant toe te voegen."
  },
  {
    "id": "offertes:nieuw",
    "label": "Nieuwe offerte",
    "route": "/offertes",
    "moduleKey": "offertes",
    "omschrijving": "Knop om een nieuwe offerte te starten."
  },
  {
    "id": "offerte:klantkiezer",
    "label": "Klant kiezen",
    "route": "/offertes/nieuw",
    "moduleKey": "offertes",
    "omschrijving": "Selecteer de klant of lead voor de offerte."
  },
  {
    "id": "offerte:regel-toevoegen",
    "label": "Productregel toevoegen",
    "route": "/offertes/nieuw",
    "moduleKey": "offertes",
    "omschrijving": "Voeg een product of dienst toe aan de offerte."
  },
  {
    "id": "offerte:opslaan",
    "label": "Offerte opslaan",
    "route": "/offertes/nieuw",
    "moduleKey": "offertes",
    "omschrijving": "Slaat de offerte op als concept."
  },
  {
    "id": "offerte:versturen",
    "label": "Offerte versturen",
    "route": "/offertes",
    "moduleKey": "offertes",
    "omschrijving": "Opent de e-maileditor om de offerte met PDF te versturen."
  },
  {
    "id": "schouwen:nieuw",
    "label": "Nieuwe schouw",
    "route": "/schouwen",
    "moduleKey": "schouwen",
    "omschrijving": "Start een nieuwe schouw via de wizard."
  },
  {
    "id": "opdrachten:nieuw",
    "label": "Nieuwe verkooporder",
    "route": "/opdrachten",
    "moduleKey": "opdrachten",
    "omschrijving": "Maakt een verkooporder aan."
  },
  {
    "id": "installaties:nieuw",
    "label": "Nieuwe installatie",
    "route": "/installaties",
    "moduleKey": "installaties",
    "omschrijving": "Plan een installatie in."
  },
  {
    "id": "opleveringen:nieuw",
    "label": "Nieuw opleverrapport",
    "route": "/opleveringen",
    "moduleKey": "opleveringen",
    "omschrijving": "Start het NEN1010-opleverrapport."
  },
  {
    "id": "planning:nieuw",
    "label": "Nieuwe afspraak",
    "route": "/planning",
    "moduleKey": "planning",
    "omschrijving": "Plan een afspraak in de agenda."
  },
  {
    "id": "helpdesk:nieuw",
    "label": "Nieuw ticket",
    "route": "/helpdesk",
    "moduleKey": "helpdesk",
    "omschrijving": "Maakt een supportticket aan."
  },
  {
    "id": "producten:nieuw",
    "label": "Nieuw product",
    "route": "/producten",
    "moduleKey": "producten",
    "omschrijving": "Voegt een product aan de catalogus toe."
  },
  {
    "id": "voorraad:mutatie",
    "label": "Voorraadmutatie",
    "route": "/voorraad",
    "moduleKey": "voorraad",
    "omschrijving": "Boekt voorraad in of uit."
  },
  {
    "id": "inkoop:nieuw",
    "label": "Nieuwe inkooporder",
    "route": "/inkoop",
    "moduleKey": "inkoop",
    "omschrijving": "Start een inkooporder bij een leverancier."
  },
  {
    "id": "instellingen:tabs",
    "label": "Instellingen-tabbladen",
    "route": "/instellingen",
    "moduleKey": null,
    "omschrijving": "Tabbladen voor bedrijf, e-mail, modules en meer."
  }
];
