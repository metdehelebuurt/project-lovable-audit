// =====================================================================
// AUTO-GENERATED — DO NOT EDIT
// Bron: src/lib/modules.ts + scripts/generate-help-knowledge.ts
// Regenereer met: npx tsx scripts/generate-help-knowledge.ts
// =====================================================================

export interface ModuleHelp {
  key: string;
  label: string;
  groep: string;
  roles: string[];
  primaryPath: string;
  extraPaths: { path: string; label: string; howTo?: string }[];
  howTo: string;
}

export const MODULE_HELP: ModuleHelp[] = [
  {
    "key": "leads",
    "label": "Leads",
    "groep": "Relatiebeheer",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur"
    ],
    "primaryPath": "/leads",
    "extraPaths": [
      {
        "path": "/leads/nieuw",
        "label": "Nieuwe lead"
      }
    ],
    "howTo": "Beheer leads in Kanban of lijst met afspraken, notities en pipeline-status."
  },
  {
    "key": "klanten",
    "label": "Klanten",
    "groep": "Relatiebeheer",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur"
    ],
    "primaryPath": "/klanten",
    "extraPaths": [],
    "howTo": "Beheer klanten met offertes, installaties en communicatiehistorie."
  },
  {
    "key": "berichten",
    "label": "Berichten",
    "groep": "Relatiebeheer",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur",
      "consument"
    ],
    "primaryPath": "/berichten",
    "extraPaths": [],
    "howTo": "Centrale inbox voor e-mailcommunicatie via gekoppelde Gmail/Outlook-accounts."
  },
  {
    "key": "schouwen",
    "label": "Schouwen",
    "groep": "Werkproces",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur",
      "consument"
    ],
    "primaryPath": "/schouwen",
    "extraPaths": [
      {
        "path": "/schouwen/snelstart",
        "label": "Snelstart schouw"
      },
      {
        "path": "/schouwen/nieuw",
        "label": "Nieuwe schouw"
      }
    ],
    "howTo": "Plan en voer schouwen uit met dakvlakken, meterkast-info, foto's en digitale handtekening."
  },
  {
    "key": "offertes",
    "label": "Offertes",
    "groep": "Werkproces",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "consument",
      "affiliate"
    ],
    "primaryPath": "/offertes",
    "extraPaths": [
      {
        "path": "/offertes/nieuw",
        "label": "Nieuwe offerte",
        "howTo": "Kies klant, voeg productregels toe, selecteer betalingstermijnplan."
      }
    ],
    "howTo": "Beheer offertes; op de detailpagina kun je direct ondertekenen en versturen."
  },
  {
    "key": "opdrachten",
    "label": "Opdrachten",
    "groep": "Werkproces",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur"
    ],
    "primaryPath": "/opdrachten",
    "extraPaths": [],
    "howTo": "Geaccepteerde offertes worden opdrachten. Plan levering, voorraad en orderbevestiging."
  },
  {
    "key": "installaties",
    "label": "Installaties",
    "groep": "Werkproces",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "installateur"
    ],
    "primaryPath": "/installaties",
    "extraPaths": [
      {
        "path": "/installaties/nieuw",
        "label": "Nieuwe installatie"
      }
    ],
    "howTo": "Plan installaties, wijs monteurs toe en volg de status."
  },
  {
    "key": "opleveringen",
    "label": "Opleveringen",
    "groep": "Werkproces",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "installateur"
    ],
    "primaryPath": "/opleveringen",
    "extraPaths": [
      {
        "path": "/opleveren/nieuw",
        "label": "Nieuw opleverrapport"
      }
    ],
    "howTo": "NEN1010-opleverrapport via 7-staps wizard met dubbele digitale handtekening."
  },
  {
    "key": "helpdesk",
    "label": "Helpdesk",
    "groep": "Service",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur"
    ],
    "primaryPath": "/helpdesk",
    "extraPaths": [
      {
        "path": "/helpdesk/nieuw",
        "label": "Nieuw ticket"
      },
      {
        "path": "/helpdesk/kennisbank",
        "label": "Kennisbank"
      }
    ],
    "howTo": "Support-tickets met SLA, prioriteiten en kennisbank."
  },
  {
    "key": "planning",
    "label": "Planning",
    "groep": "Planning",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur",
      "consument"
    ],
    "primaryPath": "/planning",
    "extraPaths": [],
    "howTo": "Interactieve kalender voor schouwen, installaties en afspraken."
  },
  {
    "key": "producten",
    "label": "Producten",
    "groep": "Catalogus",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur"
    ],
    "primaryPath": "/producten",
    "extraPaths": [],
    "howTo": "Productcatalogus met specificaties, datasheets en AI-import."
  },
  {
    "key": "voorraad",
    "label": "Voorraad",
    "groep": "Logistiek",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "installateur"
    ],
    "primaryPath": "/voorraad",
    "extraPaths": [],
    "howTo": "Voorraadoverzicht per product met mutaties, reserveringen en correcties."
  },
  {
    "key": "inkoop",
    "label": "Inkoop",
    "groep": "Logistiek",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/inkoop",
    "extraPaths": [],
    "howTo": "Module Inkoop."
  },
  {
    "key": "inkoop_ontvangsten",
    "label": "Inkoopontvangsten",
    "groep": "Logistiek",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff"
    ],
    "primaryPath": "/voorraad",
    "extraPaths": [],
    "howTo": "Registreer ontvangsten van inkooporders. Voorraad wordt automatisch bijgeboekt."
  },
  {
    "key": "retouren",
    "label": "Retouren (RMA)",
    "groep": "Logistiek",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff"
    ],
    "primaryPath": "/retouren",
    "extraPaths": [],
    "howTo": "Retouraanvragen (RMA) richting leverancier met statusopvolging."
  },
  {
    "key": "tools",
    "label": "Tools",
    "groep": "Tools",
    "roles": [
      "superadmin",
      "partner_admin",
      "partner_staff",
      "adviseur"
    ],
    "primaryPath": "/tools",
    "extraPaths": [],
    "howTo": "Verzameling tools: thuisbatterij-selector, energieadvies en webtools."
  },
  {
    "key": "energieadvies",
    "label": "Energieadvies",
    "groep": "Tools",
    "roles": [
      "superadmin",
      "partner_admin",
      "partner_staff",
      "adviseur"
    ],
    "primaryPath": "/tools/energieadvies",
    "extraPaths": [],
    "howTo": "Wizard voor woningverduurzamingsadvies met scoring en PDF-rapport."
  },
  {
    "key": "documenten",
    "label": "Documenten",
    "groep": "Catalogus",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur"
    ],
    "primaryPath": "/documenten",
    "extraPaths": [],
    "howTo": "Centrale documentenbibliotheek per entiteit (klant, offerte, installatie)."
  },
  {
    "key": "analytics",
    "label": "Analytics",
    "groep": "Inzicht",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/analytics",
    "extraPaths": [],
    "howTo": "KPI-dashboards voor leads, conversie, omzet en operationele performance."
  },
  {
    "key": "financieel_verkoop",
    "label": "Verkoopfacturen",
    "groep": "Financieel",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/financieel",
    "extraPaths": [
      {
        "path": "/financieel/nieuw",
        "label": "Nieuwe factuur"
      }
    ],
    "howTo": "Verkoopfacturen met termijnen, voorschotten, e-mail en Mollie-betaallinks."
  },
  {
    "key": "financieel_inkoop",
    "label": "Inkoopfacturen",
    "groep": "Financieel",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/financieel",
    "extraPaths": [],
    "howTo": "Inkoopfacturen en inkooporders, gekoppeld aan voorraadmutaties."
  },
  {
    "key": "financieel_pakbonnen",
    "label": "Pakbonnen",
    "groep": "Financieel",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/financieel",
    "extraPaths": [],
    "howTo": "Genereer pakbonnen voor leveringen."
  },
  {
    "key": "financieel_btw",
    "label": "BTW-aangifte",
    "groep": "Financieel",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/financieel",
    "extraPaths": [],
    "howTo": "BTW-overzicht per kwartaal voor de aangifte."
  },
  {
    "key": "financieel_openstaand",
    "label": "Openstaande posten",
    "groep": "Financieel",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/financieel",
    "extraPaths": [],
    "howTo": "Debiteuren- en crediteurenoverzicht met aanmaningen."
  },
  {
    "key": "leveranciers",
    "label": "Leveranciers",
    "groep": "Financieel",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice"
    ],
    "primaryPath": "/leveranciers",
    "extraPaths": [],
    "howTo": "Beheer leveranciers en prijslijsten; voorkeursleverancier per product."
  },
  {
    "key": "partners",
    "label": "Partners",
    "groep": "Beheer",
    "roles": [
      "superadmin"
    ],
    "primaryPath": "/partners",
    "extraPaths": [],
    "howTo": "Beheer alle partners op het platform (superadmin)."
  },
  {
    "key": "adviseurs",
    "label": "Adviseurs",
    "groep": "Beheer",
    "roles": [
      "superadmin",
      "partner_admin"
    ],
    "primaryPath": "/adviseurs",
    "extraPaths": [],
    "howTo": "Beheer adviseurs binnen je organisatie."
  },
  {
    "key": "gebruikers",
    "label": "Gebruikers",
    "groep": "Beheer",
    "roles": [
      "superadmin",
      "partner_admin"
    ],
    "primaryPath": "/gebruikers",
    "extraPaths": [],
    "howTo": "Nodig gebruikers uit, beheer rollen, permissies en module-toegang."
  },
  {
    "key": "instellingen",
    "label": "Instellingen",
    "groep": "Beheer",
    "roles": [
      "superadmin",
      "partner_admin",
      "partner_staff",
      "affiliate"
    ],
    "primaryPath": "/instellingen",
    "extraPaths": [],
    "howTo": "Organisatie-instellingen: huisstijl, e-mail, betalingsvoorwaarden, nummerreeksen, rolmatrix."
  },
  {
    "key": "affiliate_beheer",
    "label": "Affiliate beheer",
    "groep": "Beheer",
    "roles": [
      "superadmin"
    ],
    "primaryPath": "/affiliate-beheer",
    "extraPaths": [],
    "howTo": "Beheer affiliate-programma, kortingen en commissies (superadmin)."
  },
  {
    "key": "admin_abonnementen",
    "label": "Abonnementen-beheer",
    "groep": "Beheer",
    "roles": [
      "superadmin"
    ],
    "primaryPath": "/admin/abonnementen",
    "extraPaths": [],
    "howTo": "Beheer abonnementsplannen, addons en facturatie (superadmin)."
  },
  {
    "key": "profiel",
    "label": "Profiel",
    "groep": "Account",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur",
      "affiliate"
    ],
    "primaryPath": "/profiel",
    "extraPaths": [],
    "howTo": "Persoonlijk profiel: naam, foto, handtekening, e-mailkoppeling en wachtwoord."
  },
  {
    "key": "feedback",
    "label": "Feedback",
    "groep": "Account",
    "roles": [
      "superadmin",
      "partner_admin",
      "backoffice",
      "partner_staff",
      "adviseur",
      "installateur"
    ],
    "primaryPath": "/feedback",
    "extraPaths": [
      {
        "path": "/feedback/nieuw",
        "label": "Nieuwe feedback"
      }
    ],
    "howTo": "Geef feedback of dien een functieverzoek in via een korte AI-wizard."
  },
  {
    "key": "affiliates",
    "label": "Affiliates",
    "groep": "Account",
    "roles": [
      "superadmin",
      "affiliate"
    ],
    "primaryPath": "/affiliates",
    "extraPaths": [],
    "howTo": "Affiliate-dashboard met referral-links, kortingscodes en commissies."
  }
];
