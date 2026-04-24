import {
  LayoutDashboard, Inbox, Users, UserCheck2, MessageSquare, ClipboardList,
  FileText, ClipboardCheck, Wrench, ShieldCheck, Calendar, Package, Truck,
  RotateCcw, Receipt, Building2, UserCheck, FolderOpen, BarChart3, PenTool,
  LifeBuoy, BookOpen, Handshake, CreditCard, Settings, MessageSquareHeart,
  Lightbulb, Link2, Home, ShieldAlert, type LucideIcon,
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
  adviseurs: { id: "adviseurs", label: "Adviseurs", icon: UserCheck, url: "/adviseurs" } as NavigatieItem,
  gebruikers: { id: "gebruikers", label: "Gebruikers", icon: Users, url: "/gebruikers" } as NavigatieItem,
  affiliateBeheer: { id: "affiliate-beheer", label: "Affiliate beheer", icon: Handshake, url: "/affiliate-beheer" } as NavigatieItem,
  abonnementen: { id: "abonnementen", label: "Abonnementen", icon: CreditCard, url: "/admin/abonnementen" } as NavigatieItem,
  affiliateLinks: { id: "affiliate-links", label: "Affiliate links", icon: Link2, url: "/affiliates" } as NavigatieItem,
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
      items: [ITEMS.leads, ITEMS.klanten, ITEMS.offertes, ITEMS.opdrachten, ITEMS.schouwen],
    },
    {
      id: "uitvoering", label: "Uitvoering",
      items: [ITEMS.planning, ITEMS.installaties, ITEMS.opleveringen, ITEMS.voorraad, ITEMS.retouren],
    },
    { id: "financieel", label: "Financieel", items: [ITEMS.financieel, ITEMS.leveranciers] },
    { id: "catalogus", label: "Catalogus & data", items: [ITEMS.producten, ITEMS.documenten, ITEMS.analytics] },
    { id: "service", label: "Tools & service", items: [ITEMS.tools, ITEMS.helpdesk, ITEMS.kennisbank] },
    { id: "beheer", label: "Beheer", items: [
      ...(isSuper ? [ITEMS.partners] : []),
      ITEMS.adviseurs, ITEMS.gebruikers,
      ...(isSuper ? [ITEMS.affiliateBeheer, ITEMS.abonnementen, ITEMS.platformToegang] : []),
    ] },
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
      items: [ITEMS.planning, ITEMS.installaties, ITEMS.opleveringen, ITEMS.voorraad, ITEMS.retouren] },
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
      items: [ITEMS.planning, ITEMS.installaties, ITEMS.opleveringen, ITEMS.voorraad] },
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
      items: [ITEMS.installaties, ITEMS.planning, ITEMS.opleveringen, ITEMS.voorraad] },
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
    { id: "werk", label: "Werk", items: [ITEMS.vandaag] },
    { id: "verkoop", label: "Verkoop", items: [ITEMS.affiliateLinks, ITEMS.offertes] },
    { id: "support", label: "Support", items: [ITEMS.feedback, ITEMS.functieverzoek] },
    { id: "systeem", label: "Systeem", items: [ITEMS.instellingen] },
  ];
}

/** Geeft het navigatiemodel voor een rol terug. Lege groepen worden door de UI overgeslagen. */
export function getNavigation(rol: AppRole | undefined | null): NavigatieGroep[] {
  switch (rol) {
    case "superadmin":
    case "partner_admin":
      return adminNav(rol);
    case "backoffice": return backofficeNav();
    case "partner_staff": return partnerStaffNav();
    case "adviseur": return adviseurNav();
    case "installateur": return installateurNav();
    case "consument": return consumentNav();
    case "affiliate": return affiliateNav();
    default: return consumentNav();
  }
}

/** Vlakke lijst van alle items voor een rol, handig voor command palette. */
export function getAlleNavItems(rol: AppRole | undefined | null): NavigatieItem[] {
  const groepen = getNavigation(rol);
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