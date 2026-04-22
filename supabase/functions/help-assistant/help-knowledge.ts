// =====================================================================
// HELP-ASSISTANT — thin wrapper
// =====================================================================
// MODULE_HELP wordt automatisch gegenereerd uit src/lib/modules.ts via
// scripts/generate-help-knowledge.ts (npm predev/prebuild). Bij nieuwe
// modules: voeg entry toe aan src/lib/modules.ts + ENRICHMENT in het
// generate-script. Niet handmatig in dit bestand of het generated-bestand.
// =====================================================================

import { MODULE_HELP, type ModuleHelp } from "./help-knowledge.generated.ts";

export { MODULE_HELP };
export type { ModuleHelp };

const _LEGACY_REMOVED = [
  {
    key: "leads",
    label: "Leads",
    url: "/leads",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"],
    howTo: "Beheer leads in een Kanban of lijst. Nieuwe lead via /leads/nieuw. Klik op een lead voor de detailpagina met afspraken, notities en pipeline-status.",
  },
  {
    key: "klanten",
    label: "Klanten",
    url: "/klanten",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"],
    howTo: "Bekijk en beheer klanten. Klik op een klant voor de detailpagina met offertes, installaties en communicatiehistorie.",
  },
  {
    key: "berichten",
    label: "Berichten",
    url: "/berichten",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Centrale inbox voor alle e-mailcommunicatie met klanten en leads via gekoppelde Gmail/Outlook-accounts.",
  },
  {
    key: "schouwen",
    label: "Schouwen",
    url: "/schouwen",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Plan en voer schouwen uit. Snelstart via /schouwen/snelstart. Een schouw bevat dakvlakken, meterkast-info, foto's/video's en wordt afgesloten met een digitale handtekening.",
  },
  {
    key: "offertes",
    label: "Offertes",
    url: "/offertes",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"],
    howTo: "Maak een nieuwe offerte via /offertes/nieuw. Kies klant, voeg productregels toe, selecteer een betalingstermijnplan. Op de detailpagina kun je direct ondertekenen en versturen.",
  },
  {
    key: "opdrachten",
    label: "Opdrachten",
    url: "/opdrachten",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Geaccepteerde offertes worden opdrachten. Hier plan je levering, voorraad en orderbevestiging.",
  },
  {
    key: "installaties",
    label: "Installaties",
    url: "/installaties",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"],
    howTo: "Plan installaties, wijs monteurs toe en volg de status. Nieuwe installatie via /installaties/nieuw.",
  },
  {
    key: "opleveringen",
    label: "Opleveringen",
    url: "/opleveringen",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"],
    howTo: "Maak een NEN1010-opleverrapport via de 7-staps wizard (/opleveren/nieuw). Sluit af met dubbele digitale handtekening en automatische PDF-archivering.",
  },
  {
    key: "helpdesk",
    label: "Helpdesk",
    url: "/helpdesk",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Beheer support-tickets met SLA, prioriteiten en kennisbank. Nieuw ticket via /helpdesk/nieuw. Kennisbank op /helpdesk/kennisbank.",
  },
  {
    key: "planning",
    label: "Planning",
    url: "/planning",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Interactieve kalender voor schouwen (blauw), installaties (geel) en afspraken. Sleep om te verplaatsen.",
  },
  {
    key: "producten",
    label: "Producten",
    url: "/producten",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Productcatalogus met specificaties en datasheets. AI-import via de importknop. Klik op een product voor details en handleidingen.",
  },
  {
    key: "voorraad",
    label: "Voorraad",
    url: "/voorraad",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"],
    howTo: "Voorraadoverzicht per product met mutaties en reserveringen. Handmatige correctie via de correctie-knop.",
  },
  {
    key: "inkoop_ontvangsten",
    label: "Inkoopontvangsten",
    url: "/voorraad",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff"],
    howTo: "Registreer ontvangsten van inkooporders. De voorraad wordt automatisch bijgeboekt en discrepanties worden gemarkeerd.",
  },
  {
    key: "retouren",
    label: "Retouren (RMA)",
    url: "/retouren",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff"],
    howTo: "Maak een retouraanvraag (RMA) richting leverancier. Volg de status van aangemeld tot afgehandeld.",
  },
  {
    key: "tools",
    label: "Tools",
    url: "/tools",
    roles: ["superadmin", "partner_admin", "partner_staff", "adviseur"],
    howTo: "Verzameling tools waaronder thuisbatterij-selector, energieadvies en webtools (embeddable widgets).",
  },
  {
    key: "energieadvies",
    label: "Energieadvies",
    url: "/tools/energieadvies",
    roles: ["superadmin", "partner_admin", "partner_staff", "adviseur"],
    howTo: "Wizard voor woningverduurzamingsadvies met scoring en PDF-rapport.",
  },
  {
    key: "documenten",
    label: "Documenten",
    url: "/documenten",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Centrale documentenbibliotheek per entiteit (klant, offerte, installatie).",
  },
  {
    key: "analytics",
    label: "Analytics",
    url: "/analytics",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "Dashboards met KPI's voor leads, conversie, omzet en operationele performance.",
  },
  {
    key: "financieel_verkoop",
    label: "Verkoopfacturen",
    url: "/financieel",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "Maak verkoopfacturen via /financieel/nieuw. Ondersteunt termijnfacturen, voorschotten, e-mailverzending en Mollie-betaallinks.",
  },
  {
    key: "financieel_inkoop",
    label: "Inkoopfacturen",
    url: "/financieel",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "Beheer inkoopfacturen en inkooporders. Ontvangsten worden gekoppeld aan voorraadmutaties.",
  },
  {
    key: "financieel_pakbonnen",
    label: "Pakbonnen",
    url: "/financieel",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "Genereer pakbonnen voor leveringen.",
  },
  {
    key: "financieel_btw",
    label: "BTW-aangifte",
    url: "/financieel",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "BTW-overzicht per kwartaal voor de aangifte.",
  },
  {
    key: "financieel_openstaand",
    label: "Openstaande posten",
    url: "/financieel",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "Debiteuren- en crediteurenoverzicht met aanmaningen.",
  },
  {
    key: "leveranciers",
    label: "Leveranciers",
    url: "/leveranciers",
    roles: ["superadmin", "partner_admin", "backoffice"],
    howTo: "Beheer leveranciers en hun prijslijsten. Stel voorkeursleverancier per product in.",
  },
  {
    key: "adviseurs",
    label: "Adviseurs",
    url: "/adviseurs",
    roles: ["superadmin", "partner_admin"],
    howTo: "Beheer adviseurs binnen je organisatie.",
  },
  {
    key: "gebruikers",
    label: "Gebruikers",
    url: "/gebruikers",
    roles: ["superadmin", "partner_admin"],
    howTo: "Nodig nieuwe gebruikers uit, beheer rollen, permissies en module-toegang per gebruiker.",
  },
  {
    key: "instellingen",
    label: "Instellingen",
    url: "/instellingen",
    roles: ["superadmin", "partner_admin", "partner_staff", "affiliate"],
    howTo: "Organisatie-instellingen: huisstijl, e-mail, betalingsvoorwaarden, nummerreeksen, modules-rolmatrix, leadbronnen.",
  },
  {
    key: "affiliates",
    label: "Affiliates",
    url: "/affiliates",
    roles: ["superadmin", "affiliate"],
    howTo: "Affiliate-dashboard met referral-links, kortingscodes en commissies.",
  },
  {
    key: "profiel",
    label: "Profiel",
    url: "/profiel",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "affiliate"],
    howTo: "Persoonlijk profiel: naam, foto, handtekening, e-mailkoppeling en wachtwoord.",
  },
  {
    key: "feedback",
    label: "Feedback",
    url: "/feedback",
    roles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    howTo: "Geef feedback of dien een functieverzoek in via een korte AI-wizard.",
  },
];

export function buildHelpSystemPrompt(rol: string, moduleKeys: string[]): string {
  const beschikbaar = MODULE_HELP.filter(
    (m) => m.roles.includes(rol) && (moduleKeys.includes(m.key) || m.key === "profiel" || m.key === "feedback"),
  );

  const tabel = beschikbaar
    .map((m) => `- **${m.label}** — pad: \`${m.url}\` — ${m.howTo}`)
    .join("\n");

  return `Je bent de Hulp-assistent van mijnhuis.nu, een Nederlands platform voor woningverduurzaming. Je beantwoordt vragen van gebruikers over hoe het platform werkt en waar ze functies kunnen vinden.

REGELS:
1. Antwoord altijd in het Nederlands, zakelijk en kort (max 4-6 zinnen).
2. Verwijs naar functies met een markdown-link in de vorm [Naam](/pad). Gebruik UITSLUITEND interne paden uit onderstaande tabel — verzin nooit een URL.
3. Als de gebruiker vraagt naar iets dat niet in de tabel staat (geen toegang of bestaat niet), zeg dat eerlijk en stel een alternatief voor.
4. Geef korte, concrete stappen wanneer relevant ("ga naar X, klik op Y, vul Z in").
5. Geen marketing-taal, geen uitroeptekens, geen emoji's.
6. De gebruiker heeft rol "${rol}" en heeft toegang tot de onderstaande modules.

BESCHIKBARE MODULES VOOR DEZE GEBRUIKER:
${tabel || "(geen modules beschikbaar)"}

Voorbeeld:
Vraag: "Waar kan ik een nieuwe offerte maken?"
Antwoord: "Je kunt een nieuwe offerte aanmaken via [Offertes → Nieuw](/offertes/nieuw). Vul daar de klant, productregels en het betalingstermijnplan in. Na opslaan kom je op de detailpagina waar je direct kunt ondertekenen en versturen."`;
}