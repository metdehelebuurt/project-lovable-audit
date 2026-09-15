import { CalendarRange, FileSignature, Inbox, Sparkles, Stamp } from "lucide-react";

export interface TourItem {
  titel: string;
  regel: string;
  meta: string;
}

export interface TourKolom {
  titel: string;
  telling: string;
  items: TourItem[];
}

export interface TourStap {
  id: string;
  label: string;
  omschrijving: string;
  Icoon: typeof Inbox;
  url: string;
  menuActief: string;
  titel: string;
  ondertitel: string;
  badge: string;
  kolommen: TourKolom[];
}

export const TOUR_STAPPEN: TourStap[] = [
  {
    id: "leads",
    label: "Leads & sales-CRM",
    omschrijving: "Elke aanvraag direct in de pijplijn",
    Icoon: Inbox,
    url: "app.mijnhuis.nu/leads",
    menuActief: "Leads",
    titel: "Pijplijn",
    ondertitel: "Alle leads van website, telefoon en campagnes",
    badge: "7 nieuwe leads vandaag",
    kolommen: [],
  },
  {
    id: "schouw",
    label: "Schouw & offerte",
    omschrijving: "Offerte mét subsidie in 5 minuten",
    Icoon: FileSignature,
    url: "app.mijnhuis.nu/offertes",
    menuActief: "Offertes",
    titel: "Schouw & offerte",
    ondertitel: "Van opname aan de keukentafel tot getekende offerte",
    badge: "Gemiddeld 5 min per offerte",
    kolommen: [
      {
        titel: "SCHOUW GEPLAND",
        telling: "4",
        items: [
          { titel: "Fam. De Vries", regel: "Zonnepanelen · 14 panelen oost-west", meta: "Di 09:00 · Mark" },
          { titel: "Fam. Bakker", regel: "Warmtepomp · hybride", meta: "Wo 13:30 · Joost" },
        ],
      },
      {
        titel: "SCHOUW AFGEROND",
        telling: "3",
        items: [
          { titel: "Fam. Jansen", regel: "Dakvlak, meterkast en foto's compleet", meta: "Klaar voor offerte" },
        ],
      },
      {
        titel: "OFFERTE UIT",
        telling: "6",
        items: [
          { titel: "Fam. Smit", regel: "€ 8.240 incl. btw · ISDE € 2.475", meta: "Verzonden · 2 dagen" },
          { titel: "Fam. Peters", regel: "€ 12.890 incl. btw", meta: "Bekeken · 4 keer" },
        ],
      },
      {
        titel: "GETEKEND",
        telling: "2",
        items: [
          { titel: "Fam. Willems", regel: "Digitaal getekend om 14:12", meta: "Naar planning" },
        ],
      },
    ],
  },
  {
    id: "planning",
    label: "Planning & werkbon",
    omschrijving: "Wijziging staat direct op de telefoon",
    Icoon: CalendarRange,
    url: "app.mijnhuis.nu/planning",
    menuActief: "Planning",
    titel: "Weekplanning",
    ondertitel: "Ploegen, materiaal en werkbonnen in één agenda",
    badge: "Week 12 · 18 klussen",
    kolommen: [
      {
        titel: "MAANDAG",
        telling: "4",
        items: [
          { titel: "Ploeg 1 · Utrecht", regel: "14 panelen + omvormer", meta: "08:00 - 14:00" },
          { titel: "Ploeg 2 · Amersfoort", regel: "Thuisbatterij 10 kWh", meta: "09:00 - 13:00" },
        ],
      },
      {
        titel: "DINSDAG",
        telling: "5",
        items: [
          { titel: "Ploeg 1 · Zeist", regel: "Warmtepomp hybride", meta: "08:00 - 16:00" },
        ],
      },
      {
        titel: "WOENSDAG",
        telling: "5",
        items: [
          { titel: "Ploeg 3 · Nieuwegein", regel: "Laadpaal + groepenkast", meta: "10:00 - 12:30" },
        ],
      },
      {
        titel: "MATERIAAL",
        telling: "OK",
        items: [
          { titel: "Voorraad gereserveerd", regel: "Alle klussen compleet", meta: "Geen tekorten" },
        ],
      },
    ],
  },
  {
    id: "oplevering",
    label: "Oplevering",
    omschrijving: "Compleet dossier vóór de bus wegrijdt",
    Icoon: Stamp,
    url: "app.mijnhuis.nu/opleveringen",
    menuActief: "Oplevering",
    titel: "Opleveringen",
    ondertitel: "Meetwaarden, foto's en handtekening op locatie",
    badge: "NEN 1010 · dossier compleet",
    kolommen: [
      {
        titel: "IN UITVOERING",
        telling: "3",
        items: [
          { titel: "Fam. Willems", regel: "Foto's en serienummers vastgelegd", meta: "Ploeg 1" },
        ],
      },
      {
        titel: "TE ONDERTEKENEN",
        telling: "2",
        items: [
          { titel: "Fam. Jansen", regel: "Meetwaarden ingevuld, wacht op klant", meta: "Vandaag" },
        ],
      },
      {
        titel: "OPGELEVERD",
        telling: "9",
        items: [
          { titel: "Fam. Smit", regel: "Opleverrapport verstuurd als pdf", meta: "Gearchiveerd" },
        ],
      },
      {
        titel: "NAZORG",
        telling: "1",
        items: [
          { titel: "Fam. Bakker", regel: "Servicebezoek ingepland", meta: "Vr 11:00" },
        ],
      },
    ],
  },
  {
    id: "kennisbank",
    label: "AI-kennisbank",
    omschrijving: "Antwoord uit je eigen projecten",
    Icoon: Sparkles,
    url: "app.mijnhuis.nu/kennisbank",
    menuActief: "Kennisbank",
    titel: "Kennisbank",
    ondertitel: "Antwoorden uit je eigen dossiers, handleidingen en normen",
    badge: "Antwoord in 3 seconden",
    kolommen: [
      {
        titel: "VRAAG VAN DE MONTEUR",
        telling: "1",
        items: [
          { titel: "Foutcode E14 omvormer", regel: "Welke stappen doorlopen bij storing E14?", meta: "Ploeg 2 · 10:41" },
        ],
      },
      {
        titel: "ANTWOORD",
        telling: "3 bronnen",
        items: [
          { titel: "Stap 1 tot 3", regel: "Isolatieweerstand meten, string loskoppelen, firmware controleren", meta: "Uit handleiding + 2 projecten" },
        ],
      },
      {
        titel: "GEBRUIKTE BRONNEN",
        telling: "3",
        items: [
          { titel: "Handleiding omvormer", regel: "Paragraaf 7.2 storingscodes", meta: "Pdf" },
          { titel: "Project Fam. Peters", regel: "Zelfde storing, opgelost in 20 min", meta: "Servicebon" },
        ],
      },
      {
        titel: "OPGESLAGEN",
        telling: "1",
        items: [
          { titel: "Toegevoegd aan kennisbank", regel: "Volgende keer meteen beschikbaar", meta: "Automatisch" },
        ],
      },
    ],
  },
];
