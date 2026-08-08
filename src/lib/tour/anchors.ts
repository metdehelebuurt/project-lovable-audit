/**
 * Registry van tutorial-ankers. Elk anker hoort bij een `data-tour`-attribuut in
 * de UI en wordt via scripts/generate-tour-knowledge.ts als kennisbron aan de
 * hulp-assistent gegeven. Navigatie-ankers (`nav:<url>`) worden automatisch op
 * de sidebar-items gezet door AppSidebar.
 */

export interface TourAnchor {
  id: string;
  label: string;
  /** Route waar het element zichtbaar is. */
  route: string;
  /** Module-key uit src/lib/modules.ts, of null voor altijd beschikbaar. */
  moduleKey: string | null;
  omschrijving: string;
}

export const TOUR_ANCHORS: TourAnchor[] = [
  // Algemeen
  { id: "app:zoeken", label: "Zoeken", route: "*", moduleKey: null, omschrijving: "Globale zoekbalk / command palette in de header." },
  { id: "app:notificaties", label: "Notificaties", route: "*", moduleKey: null, omschrijving: "Meldingenpaneel in de header." },
  { id: "app:profielmenu", label: "Profielmenu", route: "*", moduleKey: null, omschrijving: "Menu rechtsboven met profiel, instellingen en uitloggen." },
  { id: "app:hulp", label: "Hulp nodig", route: "*", moduleKey: null, omschrijving: "Knop die de AI-hulpassistent opent." },

  // Leads
  { id: "leads:nieuw", label: "Nieuwe lead", route: "/leads", moduleKey: "leads", omschrijving: "Knop om een nieuwe lead aan te maken." },
  { id: "leads:zoek", label: "Leads zoeken", route: "/leads", moduleKey: "leads", omschrijving: "Zoekveld binnen de leadlijst." },
  { id: "leads:weergave", label: "Weergave leads", route: "/leads", moduleKey: "leads", omschrijving: "Wissel tussen lijst- en Kanban-weergave." },

  // Klanten
  { id: "klanten:nieuw", label: "Nieuwe klant", route: "/klanten", moduleKey: "klanten", omschrijving: "Knop om een klant toe te voegen." },

  // Offertes
  { id: "offertes:nieuw", label: "Nieuwe offerte", route: "/offertes", moduleKey: "offertes", omschrijving: "Knop om een nieuwe offerte te starten." },
  { id: "offerte:klantkiezer", label: "Klant kiezen", route: "/offertes/nieuw", moduleKey: "offertes", omschrijving: "Selecteer de klant of lead voor de offerte." },
  { id: "offerte:regel-toevoegen", label: "Productregel toevoegen", route: "/offertes/nieuw", moduleKey: "offertes", omschrijving: "Voeg een product of dienst toe aan de offerte." },
  { id: "offerte:opslaan", label: "Offerte opslaan", route: "/offertes/nieuw", moduleKey: "offertes", omschrijving: "Slaat de offerte op als concept." },
  { id: "offerte:versturen", label: "Offerte versturen", route: "/offertes", moduleKey: "offertes", omschrijving: "Opent de e-maileditor om de offerte met PDF te versturen." },

  // Schouwen
  { id: "schouwen:nieuw", label: "Nieuwe schouw", route: "/schouwen", moduleKey: "schouwen", omschrijving: "Start een nieuwe schouw via de wizard." },

  // Opdrachten en installaties
  { id: "opdrachten:nieuw", label: "Nieuwe verkooporder", route: "/opdrachten", moduleKey: "opdrachten", omschrijving: "Maakt een verkooporder aan." },
  { id: "installaties:nieuw", label: "Nieuwe installatie", route: "/installaties", moduleKey: "installaties", omschrijving: "Plan een installatie in." },
  { id: "opleveringen:nieuw", label: "Nieuw opleverrapport", route: "/opleveringen", moduleKey: "opleveringen", omschrijving: "Start het NEN1010-opleverrapport." },

  // Planning en helpdesk
  { id: "planning:nieuw", label: "Nieuwe afspraak", route: "/planning", moduleKey: "planning", omschrijving: "Plan een afspraak in de agenda." },
  { id: "helpdesk:nieuw", label: "Nieuw ticket", route: "/helpdesk", moduleKey: "helpdesk", omschrijving: "Maakt een supportticket aan." },

  // Producten en voorraad
  { id: "producten:nieuw", label: "Nieuw product", route: "/producten", moduleKey: "producten", omschrijving: "Voegt een product aan de catalogus toe." },
  { id: "voorraad:mutatie", label: "Voorraadmutatie", route: "/voorraad", moduleKey: "voorraad", omschrijving: "Boekt voorraad in of uit." },
  { id: "inkoop:nieuw", label: "Nieuwe inkooporder", route: "/inkoop", moduleKey: "inkoop", omschrijving: "Start een inkooporder bij een leverancier." },

  // Instellingen
  { id: "instellingen:tabs", label: "Instellingen-tabbladen", route: "/instellingen", moduleKey: null, omschrijving: "Tabbladen voor bedrijf, e-mail, modules en meer." },
];

/** Helper voor het zetten van het attribuut: <Button {...tourAnchor("offertes:nieuw")} /> */
export function tourAnchor(id: string): { "data-tour": string } {
  return { "data-tour": id };
}

export function isBekendAnker(id: string): boolean {
  return TOUR_ANCHORS.some((a) => a.id === id);
}

/** Zoekt de metadata van een anker; undefined bij een onbekend id. */
export function getAnchor(id: string): TourAnchor | undefined {
  return TOUR_ANCHORS.find((a) => a.id === id);
}
