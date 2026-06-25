import type { Database } from "@/integrations/supabase/types";

export type AffiliateLeadStatus = Database["public"]["Enums"]["affiliate_lead_status"];
export type AffiliateLeadBron = Database["public"]["Enums"]["affiliate_lead_bron"];
export type AffiliateContactType = Database["public"]["Enums"]["affiliate_contact_type"];

export const STATUS_VOLGORDE: AffiliateLeadStatus[] = [
  "nieuw",
  "nieuw_campagne",
  "nieuw_demo_voltooid",
  "gebeld_geen_gehoor",
  "mail_gestuurd",
  "terugbel_gepland",
  "gesprek_gepland",
  "demo_gepland",
  "in_gesprek",
  "voorstel_verstuurd",
  "trial_gestart",
  "gewonnen",
  "verloren",
];

export const STATUS_LABEL: Record<AffiliateLeadStatus, string> = {
  nieuw: "Nieuw - Koude leads",
  nieuw_campagne: "Nieuw - Campagne",
  nieuw_demo_voltooid: "Nieuw - Demo voltooid",
  gebeld_geen_gehoor: "Gebeld, geen gehoor",
  mail_gestuurd: "Mail gestuurd",
  terugbel_gepland: "Terugbel gepland",
  gesprek_gepland: "Gesprek gepland",
  demo_gepland: "Demo gepland",
  in_gesprek: "In gesprek",
  voorstel_verstuurd: "Voorstel verstuurd",
  trial_gestart: "Trial gestart",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};

export const STATUS_KLEUR: Record<AffiliateLeadStatus, string> = {
  nieuw: "bg-slate-100 text-slate-700",
  nieuw_campagne: "bg-blue-100 text-blue-800",
  nieuw_demo_voltooid: "bg-emerald-100 text-emerald-800",
  gebeld_geen_gehoor: "bg-amber-100 text-amber-800",
  mail_gestuurd: "bg-cyan-100 text-cyan-800",
  terugbel_gepland: "bg-sky-100 text-sky-800",
  gesprek_gepland: "bg-blue-100 text-blue-800",
  demo_gepland: "bg-violet-100 text-violet-800",
  in_gesprek: "bg-indigo-100 text-indigo-800",
  voorstel_verstuurd: "bg-fuchsia-100 text-fuchsia-800",
  trial_gestart: "bg-teal-100 text-teal-800",
  gewonnen: "bg-emerald-100 text-emerald-800",
  verloren: "bg-rose-100 text-rose-800",
};

export const CONTACT_UITKOMST_OPTIES = [
  { value: "geen_gehoor", label: "Geen gehoor", nextStatus: "gebeld_geen_gehoor" as AffiliateLeadStatus },
  { value: "niet_interessant", label: "Niet interessant", nextStatus: "verloren" as AffiliateLeadStatus },
  { value: "terugbellen", label: "Terugbellen", nextStatus: "terugbel_gepland" as AffiliateLeadStatus },
  { value: "gesprek_gepland", label: "Afspraak gepland", nextStatus: "gesprek_gepland" as AffiliateLeadStatus },
  { value: "voorstel", label: "Voorstel doen", nextStatus: "voorstel_verstuurd" as AffiliateLeadStatus },
  { value: "gewonnen", label: "Gewonnen", nextStatus: "gewonnen" as AffiliateLeadStatus },
];