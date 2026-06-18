import type { Database } from "@/integrations/supabase/types";

export type AffiliateLeadStatus = Database["public"]["Enums"]["affiliate_lead_status"];
export type AffiliateLeadBron = Database["public"]["Enums"]["affiliate_lead_bron"];
export type AffiliateContactType = Database["public"]["Enums"]["affiliate_contact_type"];

export const STATUS_VOLGORDE: AffiliateLeadStatus[] = [
  "nieuw",
  "gebeld_geen_gehoor",
  "gesprek_gepland",
  "in_gesprek",
  "voorstel_verstuurd",
  "gewonnen",
  "verloren",
];

export const STATUS_LABEL: Record<AffiliateLeadStatus, string> = {
  nieuw: "Nieuw",
  gebeld_geen_gehoor: "Gebeld, geen gehoor",
  gesprek_gepland: "Gesprek gepland",
  in_gesprek: "In gesprek",
  voorstel_verstuurd: "Voorstel verstuurd",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};

export const STATUS_KLEUR: Record<AffiliateLeadStatus, string> = {
  nieuw: "bg-slate-100 text-slate-700",
  gebeld_geen_gehoor: "bg-amber-100 text-amber-800",
  gesprek_gepland: "bg-blue-100 text-blue-800",
  in_gesprek: "bg-indigo-100 text-indigo-800",
  voorstel_verstuurd: "bg-violet-100 text-violet-800",
  gewonnen: "bg-emerald-100 text-emerald-800",
  verloren: "bg-rose-100 text-rose-800",
};

export const CONTACT_UITKOMST_OPTIES = [
  { value: "geen_gehoor", label: "Geen gehoor", nextStatus: "gebeld_geen_gehoor" as AffiliateLeadStatus },
  { value: "niet_interessant", label: "Niet interessant", nextStatus: "verloren" as AffiliateLeadStatus },
  { value: "terugbellen", label: "Terugbellen", nextStatus: "gebeld_geen_gehoor" as AffiliateLeadStatus },
  { value: "gesprek_gepland", label: "Afspraak gepland", nextStatus: "gesprek_gepland" as AffiliateLeadStatus },
  { value: "voorstel", label: "Voorstel doen", nextStatus: "voorstel_verstuurd" as AffiliateLeadStatus },
  { value: "gewonnen", label: "Gewonnen", nextStatus: "gewonnen" as AffiliateLeadStatus },
];