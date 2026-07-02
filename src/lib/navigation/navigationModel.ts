import {
  LayoutDashboard, Inbox, Users, UserCheck2, MessageSquare, ClipboardList,
  FileText, ClipboardCheck, Wrench, ShieldCheck, Calendar, Package, Truck,
  RotateCcw, Receipt, Building2, UserCheck, FolderOpen, BarChart3, PenTool, Stethoscope,
  LifeBuoy, BookOpen, Handshake, CreditCard, Settings, MessageSquareHeart,
  Lightbulb, Link2, Home, ShieldAlert, ShoppingCart, type LucideIcon,
  ScrollText, PhoneCall, Kanban, AlertCircle,
  Target, Sparkles,
} from "lucide-react";
import type { AppRole } from "@/lib/permissions";

/**
 * Eén centraal navigatiemodel voor sidebar, command palette en mobiele bottom-nav.
 * Per rol bepaalt `getNavigation` welke items in welke groep verschijnen.
 */

export interface NavigatieItem {
  id: string;
  label: string;
  icon: LucideIcon;
  url: string;
  /** Optionele entiteit-key voor badge-counts (matcht useModuleNotificatieCounts). */
  badgeEntiteit?: string;
  /** Synoniemen voor command-palette zoek. */
  synoniemen?: string[];
  /** Optionele moduleKey voor toegangscheck. */
  moduleKey?: string;
}

export interface NavigatieGroep {
  id: string;
  label: string;
  items: NavigatieItem[];
}

/* ─── Item-defs (één bron, hergebruikt per rol) ─── */

const ITEMS = {
  vandaag: { id: "vandaag", label: "Vandaag", icon: LayoutDashboard, url: "/vandaag",
    synoniemen: ["dashboard", "overzicht", "home"] } as NavigatieItem,
  dashboard: { id: "dashboard", label: "Dashboard", icon: BarChart3, url: "/dashboard",
    synoniemen: ["statistieken", "overzicht", "kpi"] } as NavigatieItem,
  actiecentrum: { id: "actiecentrum", label: "Actiecentrum", icon: Inbox, url: "/actiecentrum",
    synoniemen: ["taken", "todo"] } as NavigatieItem,
  berichten: { id: "berichten", label: "Berichten", icon: MessageSquare, url: "/berichten",
    moduleKey: "berichten_inbox", synoniemen: ["mail", "inbox"] } as NavigatieItem,
  leads: { id: "leads", label: "Leads", icon: Users, url: "/leads", badgeEntiteit: "leads",
    synoniemen: ["prospects", "aanvragen"] } as NavigatieItem,
  klanten: { id: "klanten", label: "Klanten", icon: UserCheck2, url: "/klanten",
    synoniemen: ["consumenten"] } as NavigatieItem,
  schouwen: { id: "schouwen", label: "Schouwen", icon: ClipboardList, url: "/schouwen",
    badgeEntiteit: "schouwen", synoniemen: ["inspectie", "opname"] } as NavigatieItem,
  offertes: { id: "offertes", label: "Offertes", icon: FileText, url: "/offertes",
    badgeEntiteit: "offertes", synoniemen: ["quotes", "voorstellen"] } as NavigatieItem,
  opdrachten: { id: "opdrachten", label: "Verkooporders", icon: ClipboardCheck, url: "/opdrachten",
    synoniemen: ["orders"] } as NavigatieItem,
  installaties: { id: "installaties", label: "Installaties", icon: Wrench, url: "/installaties",
    badgeEntiteit: "installaties", synoniemen: ["uitvoering", "monteur"] } as NavigatieItem,
  opleveringen: { id: "opleveringen", label: "Opleveringen", icon: ShieldCheck, url: "/opleveringen",
    synoniemen: ["oplever", "rapport", "nen1010"] } as NavigatieItem,
  keuringen: { id: "keuringen", label: "Keuringen", icon: Stethoscope, url: "/keuringen",
    synoniemen: ["periodieke keuring", "scope 12", "nen 3140", "inspectie pv", "thuisbatterij keuring"] } as NavigatieItem,
  planning: { id: "planning", label: "Planning", icon: Calendar, url: "/planning",
    badgeEntiteit: "afspraken", synoniemen: ["agenda", "kalender"] } as NavigatieItem,
  voorraad: { id: "voorraad", label: "Voorraad", icon: Package, url: "/voorraad" } as NavigatieItem,
  inkoop: { id: "inkoop", label: "Inkoop", icon: ShoppingCart, url: "/inkoop",
    moduleKey: "inkoop", synoniemen: ["inkooporder", "bestelling", "leverancier order"] } as NavigatieItem,
  retouren: { id: "retouren", label: "Retouren", icon: RotateCcw, url: "/retouren",
    synoniemen: ["rma"] } as NavigatieItem,
  leveranciers: { id: "leveranciers", label: "Leveranciers", icon: Truck, url: "/leveranciers" } as NavigatieItem,
  financieel: { id: "financieel", label: "Financieel", icon: Receipt, url: "/financieel",
    synoniemen: ["facturen", "boekhouding"] } as NavigatieItem,
  producten: { id: "producten", label: "Producten", icon: Package, url: "/producten",
    synoniemen: ["catalogus", "assortiment"] } as NavigatieItem,
  assemblages: { id: "assemblages", label: "Samengestelde producten", icon: Layers, url: "/producten/assemblages",
    moduleKey: "assemblages", synoniemen: ["bundels", "assemblage", "stuklijst", "pakket"] } as NavigatieItem,
  documenten: { id: "documenten", label: "Documenten", icon: FolderOpen, url: "/documenten",
    synoniemen: ["bestanden"] } as NavigatieItem,
  tools: { id: "tools", label: "Tools", icon: PenTool, url: "/tools",
    synoniemen: ["webtools", "widgets"] } as NavigatieItem,
  analytics: { id: "analytics", label: "Analytics", icon: BarChart3, url: "/analytics",
    synoniemen: ["rapportage", "statistieken"] } as NavigatieItem,
  helpdesk: { id: "helpdesk", label: "Helpdesk", icon: LifeBuoy, url: "/helpdesk",
    synoniemen: ["support", "tickets"] } as NavigatieItem,
  kennisbank: { id: "kennisbank", label: "Kennisbank", icon: BookOpen, url: "/helpdesk/kennisbank",
    synoniemen: ["wiki", "kb"] } as NavigatieItem,
  partners: { id: "partners", label: "Partners", icon: Building2, url: "/partners" } as NavigatieItem,
  platformToegang: { id: "platform-toegang", label: "Platformtoegang", icon: ShieldAlert,
    url: "/superadmin/access-grants", synoniemen: ["break-glass", "access grants"] } as NavigatieItem,
  systeemlogs: { id: "systeemlogs", label: "Systeemlogs", icon: ScrollText,
    url: "/superadmin/logs", synoniemen: ["errors", "fouten", "logs", "edge logs", "auth logs"] } as NavigatieItem,
  emaillogs: { id: "emaillogs", label: "E-maillogs", icon: ScrollText,
    url: "/superadmin/email-logs", synoniemen: ["mail logs", "verzendlogs", "email"] } as NavigatieItem,
  adviseurs: { id: "adviseurs", label: "Adviseurs", icon: UserCheck, url: "/adviseurs" } as NavigatieItem,
  gebruikers: { id: "gebruikers", label: "Gebruikers", icon: Users, url: "/gebruikers" } as NavigatieItem,
  affiliateBeheer: { id: "affiliate-beheer", label: "Affiliate beheer", icon: Handshake, url: "/affiliate-beheer" } as NavigatieItem,
  sales: { id: "sales", label: "Sales", icon: Target, url: "/sales",
    synoniemen: ["crm", "prospects", "koude leads", "warme leads", "pipeline platform"] } as NavigatieItem,
  abonnementen: { id: "abonnementen", label: "Abonnementen", icon: CreditCard, url: "/admin/abonnementen" } as NavigatieItem,
  affiliateLinks: { id: "affiliate-links", label: "Affiliate links", icon: Link2, url: "/affiliates" } as NavigatieItem,
  affiliatePipeline: { id: "affiliate-pipeline", label: "Pipeline", icon: Kanban, url: "/affiliates/pipeline",
    synoniemen: ["sales", "kanban"] } as NavigatieItem,
  affiliateBellen: { id: "affiliate-bellen", label: "Bellen", icon: PhoneCall, url: "/affiliates/bellen",
    synoniemen: ["belwerkbank", "cold calling"] } as NavigatieItem,
  affiliatePool: { id: "affiliate-pool", label: "Leads", icon: Users, url: "/affiliates/pool",
    synoniemen: ["leadpool", "claim", "koude leads", "warme leads"] } as NavigatieItem,
  affiliateMijnKlanten: { id: "affiliate-klanten", label: "Mijn klanten", icon: UserCheck2, url: "/affiliates/klanten" } as NavigatieItem,
  affiliateTrials: { id: "affiliate-trials", label: "Trials", icon: AlertCircle, url: "/affiliates/trials" } as NavigatieItem,
  affiliateAgenda: { id: "affiliate-agenda", label: "Terugbelagenda", icon: Calendar, url: "/affiliates/agenda",
    synoniemen: ["agenda", "terugbel", "afspraken"] } as NavigatieItem,
  salesAgenda: { id: "sales-agenda", label: "Sales-agenda", icon: Calendar, url: "/sales/agenda",
    synoniemen: ["agenda affiliates", "affiliate agenda", "planning sales"] } as NavigatieItem,
  salesAffiliates: { id: "sales-affiliates", label: "Mijn affiliates", icon: Users, url: "/sales/affiliates",
    synoniemen: ["affiliates beheer", "mijn team", "affiliate overzicht"] } as NavigatieItem,
  salesDemoPlanning: { id: "sales-demo-planning", label: "Demoplanning", icon: ClipboardList, url: "/sales/demo-planning",
    synoniemen: ["demo agenda", "trial planning", "demo overzicht", "geplande demos"] } as NavigatieItem,
  affiliateOpvolging: { id: "affiliate-opvolging", label: "Opvolging", icon: Sparkles, url: "/affiliates/opvolging",
    synoniemen: ["taken", "herinneringen", "ai opvolging", "follow-up"] } as NavigatieItem,
  affiliateAnalytics: { id: "affiliate-analytics", label: "Analytics", icon: BarChart3, url: "/affiliates/analytics",
    synoniemen: ["rapportage", "statistieken"] } as NavigatieItem,
  feedback: { id: "feedback", label: "Feedback", icon: MessageSquareHeart, url: "/feedback" } as NavigatieItem,
  functieverzoek: { id: "functieverzoek", label: "Functieverzoek", icon: Lightbulb,
    url: "/feedback/nieuw?type=functieverzoek", synoniemen: ["wens", "feature request"] } as NavigatieItem,
  instellingen: { id: "instellingen", label: "Instellingen", icon: Settings, url: "/instellingen",
    synoniemen: ["voorkeuren", "profiel"] } as NavigatieItem,
  mijnWoning: { id: "mijn-woning", label: "Mijn woning", icon: Home, url: "/vandaag" } as NavigatieItem,
} as const;

/* ─── Per rol: groepen ─── */

function adminNav(rol: AppRole): NavigatieGroep[] {
  const isSuper = rol === "superadmin";
  return [
    {
      id: "werk", label: "Werk",
      items: [ITEMS.vandaag, ITEMS.dashboard, ITEMS.actiecentrum, ITEMS.berichten],
    },
    {
      id: "verkoop", label: "Klant & Verkoop",
      items: [
        ITEMS.leads, ITEMS.klanten, ITEMS.offertes, ITEMS.opdrachten, ITEMS.schouwen,
        ...(isSuper ? [ITEMS.sales] : []),
      ],
    },
    {
      id: "uitvoering", label: "Uitvoering",
      items: [ITEMS.planning, ITEMS.installaties, ITEMS.opleveringen, ITEMS.keuringen, ITEMS.voorraad, ITEMS.inkoop, ITEMS.retouren],
    },
    { id: "financieel", label: "Financieel", items: [ITEMS.financieel, ITEMS.leveranciers] },
    { id: "catalogus", label: "Catalogus & data", items: [ITEMS.producten, ITEMS.documenten, ITEMS.analytics] },
    { id: "service", label: "Tools & service", items: [ITEMS.tools, ITEMS.helpdesk, ITEMS.kennisbank] },
    { id: "beheer", label: "Beheer", items: [
      ...(isSuper ? [ITEMS.partners] : []),
      ITEMS.adviseurs, ITEMS.gebruikers,
      ...(isSuper ? [ITEMS.affiliateBeheer, ITEMS.abonnementen, ITEMS.platformToegang] : []),
    ] },
    ...(isSuper ? [{ id: "systeem-superadmin", label: "Platform-systeem", items: [ITEMS.systeemlogs, ITEMS.emaillogs] }] : []),
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

function backofficeNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk", items: [ITEMS.vandaag, ITEMS.dashboard, ITEMS.actiecentrum, ITEMS.berichten] },
    { id: "verkoop", label: "Klant & Verkoop",
      items: [ITEMS.leads, ITEMS.klanten, ITEMS.offertes, ITEMS.opdrachten, ITEMS.schouwen] },
    { id: "uitvoering", label: "Uitvoering",
      items: [ITEMS.planning, ITEMS.installaties, ITEMS.opleveringen, ITEMS.keuringen, ITEMS.voorraad, ITEMS.inkoop, ITEMS.retouren] },
    { id: "financieel", label: "Financieel", items: [ITEMS.financieel, ITEMS.leveranciers] },
    { id: "catalogus", label: "Catalogus & data", items: [ITEMS.producten, ITEMS.documenten, ITEMS.analytics] },
    { id: "service", label: "Service", items: [ITEMS.helpdesk, ITEMS.kennisbank] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

function partnerStaffNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk", items: [ITEMS.vandaag, ITEMS.dashboard, ITEMS.actiecentrum, ITEMS.berichten] },
    { id: "verkoop", label: "Klant & Verkoop",
      items: [ITEMS.leads, ITEMS.klanten, ITEMS.offertes, ITEMS.opdrachten, ITEMS.schouwen] },
    { id: "uitvoering", label: "Uitvoering",
      items: [ITEMS.planning, ITEMS.installaties, ITEMS.opleveringen, ITEMS.keuringen, ITEMS.voorraad] },
    { id: "catalogus", label: "Catalogus", items: [ITEMS.producten, ITEMS.documenten] },
    { id: "service", label: "Service", items: [ITEMS.helpdesk, ITEMS.kennisbank] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

function adviseurNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk", items: [ITEMS.vandaag, ITEMS.actiecentrum, ITEMS.berichten] },
    { id: "verkoop", label: "Klant & Verkoop",
      items: [ITEMS.leads, ITEMS.klanten, ITEMS.schouwen, ITEMS.offertes] },
    { id: "uitvoering", label: "Uitvoering",
      items: [ITEMS.planning] },
    { id: "catalogus", label: "Catalogus & tools", items: [ITEMS.producten, ITEMS.tools, ITEMS.documenten] },
    { id: "service", label: "Service", items: [ITEMS.helpdesk, ITEMS.kennisbank] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

function installateurNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk", items: [ITEMS.vandaag, ITEMS.actiecentrum, ITEMS.berichten] },
    { id: "uitvoering", label: "Uitvoering",
      items: [ITEMS.installaties, ITEMS.planning, ITEMS.opleveringen, ITEMS.keuringen, ITEMS.voorraad] },
    { id: "verkoop", label: "Klant & Verkoop",
      items: [ITEMS.opdrachten] },
    { id: "catalogus", label: "Catalogus", items: [ITEMS.producten, ITEMS.documenten] },
    { id: "service", label: "Service", items: [ITEMS.helpdesk, ITEMS.kennisbank] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

function consumentNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk",
      items: [{ ...ITEMS.mijnWoning }, { ...ITEMS.berichten, label: "Berichten" }] },
    { id: "verkoop", label: "Mijn dossier",
      items: [{ ...ITEMS.offertes, label: "Mijn offertes" }, { ...ITEMS.schouwen, label: "Mijn schouwen" }] },
    { id: "uitvoering", label: "Planning",
      items: [{ ...ITEMS.planning, label: "Mijn afspraken" }] },
    { id: "support", label: "Support", items: [ITEMS.feedback] },
  ];
}

function affiliateNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk", items: [ITEMS.affiliateLinks, ITEMS.berichten] },
    { id: "sales", label: "Sales CRM", items: [
      ITEMS.affiliatePipeline, ITEMS.affiliateBellen, ITEMS.affiliatePool,
      ITEMS.affiliateAgenda, ITEMS.affiliateOpvolging,
      ITEMS.affiliateMijnKlanten, ITEMS.affiliateTrials, ITEMS.offertes,
      ITEMS.affiliateAnalytics,
    ] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

function salesManagerNav(): NavigatieGroep[] {
  return [
    { id: "werk", label: "Werk", items: [ITEMS.affiliateLinks, ITEMS.berichten] },
    { id: "sales", label: "Sales CRM", items: [
      ITEMS.salesAffiliates,
      ITEMS.salesAgenda,
      ITEMS.salesDemoPlanning,
      ITEMS.affiliatePipeline, ITEMS.affiliateBellen, ITEMS.affiliatePool,
      ITEMS.affiliateAgenda, ITEMS.affiliateOpvolging,
      ITEMS.affiliateMijnKlanten, ITEMS.affiliateTrials, ITEMS.offertes,
      ITEMS.affiliateAnalytics,
    ] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

/** Geeft het navigatiemodel voor een rol terug. Lege groepen worden door de UI overgeslagen. */
export function getNavigation(
  rol: AppRole | undefined | null,
  extraRollen: AppRole[] = [],
): NavigatieGroep[] {
  let groepen: NavigatieGroep[];
  switch (rol) {
    case "superadmin":
    case "partner_admin":
      groepen = adminNav(rol); break;
    case "backoffice": groepen = backofficeNav(); break;
    case "partner_staff": groepen = partnerStaffNav(); break;
    case "adviseur": groepen = adviseurNav(); break;
    case "installateur": groepen = installateurNav(); break;
    case "consument": groepen = consumentNav(); break;
    case "affiliate": groepen = affiliateNav(); break;
    case "sales_manager": groepen = salesManagerNav(); break;
    default: groepen = consumentNav();
  }

  // Voeg additieve modules toe als de gebruiker er extra rollen bovenop heeft,
  // zonder zijn primaire navigatie te wijzigen.
  if (extraRollen.includes("affiliate") && rol !== "affiliate" && rol !== "sales_manager") {
    const aff = affiliateNav();
    const sales = aff.find((g) => g.id === "sales");
    const werk = aff.find((g) => g.id === "werk");
    const extra: NavigatieGroep = {
      id: "affiliate-module",
      label: "Affiliate",
      items: [
        ...(werk?.items.filter((i) => i.id === "affiliate-links") ?? []),
        ...(sales?.items ?? []),
      ],
    };
    groepen = [...groepen, extra];
  }
  return groepen;
}

/** Vlakke lijst van alle items voor een rol, handig voor command palette. */
export function getAlleNavItems(
  rol: AppRole | undefined | null,
  extraRollen: AppRole[] = [],
): NavigatieItem[] {
  const groepen = getNavigation(rol, extraRollen);
  const out: NavigatieItem[] = [];
  for (const g of groepen) {
    out.push(...g.items);
  }
  // dedupe op id
  const gezien = new Set<string>();
  return out.filter((i) => {
    if (gezien.has(i.id)) return false;
    gezien.add(i.id);
    return true;
  });
}