import {
  Users, ClipboardList, FileText, Wrench, Calendar, Package, BarChart3,
  UserCheck2, ClipboardCheck, MessageSquare, FolderOpen, PenTool, Handshake,
  ShieldCheck, Receipt, Truck, LifeBuoy, BookOpen, CreditCard, Building2,
  UserCheck, Settings, Inbox, MessageSquareHeart, Lightbulb, RotateCcw, Link2,
  Home, CalendarClock, type LucideIcon,
} from "lucide-react";
import type { AppKleur, AppRole } from "./appColors";

export type AppCategorie =
  | "overzicht"
  | "relaties"
  | "werkproces"
  | "planning"
  | "beheer"
  | "support"
  | "financieel"
  | "logistiek"
  | "helpdesk";

export interface AppDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  url: string;
  kleur: AppKleur;
  rollen: AppRole[];
  moduleKey?: string;
  synoniemen?: string[];
  categorie: AppCategorie;
  badgeEntiteit?: string;
}

const ALL_BUSINESS: AppRole[] = [
  "superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur",
];

export const APPS: AppDefinition[] = [
  // Overzicht
  { id: "actiecentrum", label: "Actiecentrum", icon: Inbox, url: "/actiecentrum", kleur: "indigo",
    rollen: ALL_BUSINESS, categorie: "overzicht", synoniemen: ["acties", "todo", "taken"] },

  // Relaties
  { id: "leads", label: "Leads", icon: Users, url: "/leads", kleur: "violet",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"],
    categorie: "relaties", badgeEntiteit: "leads", synoniemen: ["prospects", "aanvragen"] },
  { id: "klanten", label: "Klanten", icon: UserCheck2, url: "/klanten", kleur: "blauw",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"],
    categorie: "relaties", synoniemen: ["consumenten"] },
  { id: "berichten", label: "Berichten", icon: MessageSquare, url: "/berichten", kleur: "cyaan",
    rollen: [...ALL_BUSINESS, "consument"], categorie: "relaties",
    moduleKey: "berichten_inbox", synoniemen: ["mail", "inbox", "email"] },

  // Werkproces
  { id: "schouwen", label: "Schouwen", icon: ClipboardList, url: "/schouwen", kleur: "blauw",
    rollen: [...ALL_BUSINESS, "consument"], categorie: "werkproces",
    badgeEntiteit: "schouwen", synoniemen: ["inspectie", "opname"] },
  { id: "offertes", label: "Offertes", icon: FileText, url: "/offertes", kleur: "violet",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "consument", "affiliate"],
    categorie: "werkproces", badgeEntiteit: "offertes", synoniemen: ["quotes", "voorstellen"] },
  { id: "opdrachten", label: "Verkooporders", icon: ClipboardCheck, url: "/opdrachten", kleur: "amber",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    categorie: "werkproces", synoniemen: ["orders", "verkoop"] },
  { id: "installaties", label: "Installaties", icon: Wrench, url: "/installaties", kleur: "oranje",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"],
    categorie: "werkproces", badgeEntiteit: "installaties", synoniemen: ["uitvoering", "monteur"] },
  { id: "opleveringen", label: "Opleveringen", icon: ShieldCheck, url: "/opleveringen", kleur: "groen",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"],
    categorie: "werkproces", synoniemen: ["oplever", "rapport", "nen1010"] },

  // Helpdesk
  { id: "helpdesk", label: "Helpdesk", icon: LifeBuoy, url: "/helpdesk", kleur: "rood",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    categorie: "helpdesk", synoniemen: ["support", "tickets", "service"] },
  { id: "helpdesk-tickets", label: "Tickets", icon: LifeBuoy, url: "/helpdesk/tickets", kleur: "rood",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    categorie: "helpdesk" },
  { id: "kennisbank", label: "Kennisbank", icon: BookOpen, url: "/helpdesk/kennisbank", kleur: "teal",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    categorie: "helpdesk", synoniemen: ["kb", "wiki"] },

  // Financieel
  { id: "financieel", label: "Financieel", icon: Receipt, url: "/financieel", kleur: "amber",
    rollen: ["superadmin", "partner_admin", "backoffice"], categorie: "financieel",
    synoniemen: ["facturen", "boekhouding"] },
  { id: "leveranciers", label: "Leveranciers", icon: Truck, url: "/leveranciers", kleur: "grijs",
    rollen: ["superadmin", "partner_admin", "backoffice"], categorie: "financieel" },

  // Logistiek
  { id: "voorraad", label: "Voorraad", icon: Package, url: "/voorraad", kleur: "teal",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"],
    categorie: "logistiek" },
  { id: "retouren", label: "Retouren", icon: RotateCcw, url: "/retouren", kleur: "fuchsia",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff"], categorie: "logistiek",
    synoniemen: ["rma"] },

  // Planning & tools
  { id: "planning", label: "Planning", icon: Calendar, url: "/planning", kleur: "teal",
    rollen: ["partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"],
    categorie: "planning", badgeEntiteit: "afspraken", synoniemen: ["agenda", "kalender"] },
  { id: "producten", label: "Producten", icon: Package, url: "/producten", kleur: "roze",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"],
    categorie: "planning", synoniemen: ["catalogus", "assortiment"] },
  { id: "tools", label: "Tools", icon: PenTool, url: "/tools", kleur: "limoen",
    rollen: ["superadmin", "partner_admin", "adviseur"], categorie: "planning",
    synoniemen: ["webtools", "widgets"] },
  { id: "analytics", label: "Analytics", icon: BarChart3, url: "/analytics", kleur: "indigo",
    rollen: ["partner_admin", "backoffice"], categorie: "planning",
    synoniemen: ["rapportage", "statistieken"] },

  // Beheer
  { id: "documenten", label: "Documenten", icon: FolderOpen, url: "/documenten", kleur: "blauw",
    rollen: ALL_BUSINESS, categorie: "beheer", synoniemen: ["bestanden", "files"] },
  { id: "partners", label: "Partners", icon: Building2, url: "/partners", kleur: "violet",
    rollen: ["superadmin"], categorie: "beheer" },
  { id: "adviseurs", label: "Adviseurs", icon: UserCheck, url: "/adviseurs", kleur: "indigo",
    rollen: ["superadmin", "partner_admin"], categorie: "beheer" },
  { id: "gebruikers", label: "Gebruikers", icon: Users, url: "/gebruikers", kleur: "violet",
    rollen: ["superadmin", "partner_admin"], categorie: "beheer" },
  { id: "affiliate-beheer", label: "Affiliate Beheer", icon: Handshake, url: "/affiliate-beheer", kleur: "fuchsia",
    rollen: ["superadmin", "sales_manager"], categorie: "beheer" },
  { id: "geplande-demos", label: "Geplande demo's", icon: CalendarClock, url: "/affiliate-beheer?tab=demos", kleur: "violet",
    rollen: ["superadmin", "sales_manager"], categorie: "planning",
    synoniemen: ["demo overzicht", "demoafspraken", "sales demos"] },
  { id: "abonnementen", label: "Abonnementen", icon: CreditCard, url: "/admin/abonnementen", kleur: "amber",
    rollen: ["superadmin"], categorie: "beheer" },
  { id: "affiliate-links", label: "Affiliate Links", icon: Link2, url: "/affiliates", kleur: "fuchsia",
    rollen: ["affiliate", "sales_manager"], categorie: "beheer" },

  // Support
  { id: "feedback", label: "Feedback", icon: MessageSquareHeart, url: "/feedback", kleur: "roze",
    rollen: [...ALL_BUSINESS, "consument", "affiliate"], categorie: "support" },
  { id: "functieverzoek", label: "Functieverzoek", icon: Lightbulb, url: "/feedback/nieuw?type=functieverzoek",
    kleur: "amber", rollen: [...ALL_BUSINESS, "consument", "affiliate"], categorie: "support",
    synoniemen: ["feature request", "wens"] },

  // Consument
  { id: "mijn-woning", label: "Mijn Woning", icon: Home, url: "/dashboard", kleur: "blauw",
    rollen: ["consument"], categorie: "overzicht" },

  // Instellingen
  { id: "instellingen", label: "Instellingen", icon: Settings, url: "/instellingen", kleur: "grijs",
    rollen: ALL_BUSINESS, categorie: "beheer", synoniemen: ["voorkeuren", "profiel"] },
];

/** Filter alle apps op rol. Module-toggles worden later in de view gerespecteerd. */
export function appsVoorRol(rol: AppRole): AppDefinition[] {
  return APPS.filter((app) => app.rollen.includes(rol));
}

export function appById(id: string): AppDefinition | undefined {
  return APPS.find((a) => a.id === id);
}
