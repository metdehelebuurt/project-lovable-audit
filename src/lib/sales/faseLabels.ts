import type { Database } from "@/integrations/supabase/types";

export type SalesFase = Database["public"]["Enums"]["sales_fase"];

export const SALES_FASES: SalesFase[] = [
  "koud",
  "benaderd",
  "warm",
  "gekwalificeerd",
  "doorgezet",
  "gewonnen",
  "verloren",
];

export const FASE_LABEL: Record<SalesFase, string> = {
  koud: "Koud",
  benaderd: "Benaderd",
  warm: "Warm",
  gekwalificeerd: "Gekwalificeerd",
  doorgezet: "Doorgezet",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};

export const FASE_COLOR: Record<SalesFase, string> = {
  koud: "bg-slate-100 text-slate-700 border-slate-200",
  benaderd: "bg-blue-100 text-blue-700 border-blue-200",
  warm: "bg-orange-100 text-orange-700 border-orange-200",
  gekwalificeerd: "bg-purple-100 text-purple-700 border-purple-200",
  doorgezet: "bg-amber-100 text-amber-700 border-amber-200",
  gewonnen: "bg-emerald-100 text-emerald-700 border-emerald-200",
  verloren: "bg-rose-100 text-rose-700 border-rose-200",
};