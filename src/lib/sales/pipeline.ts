import type { Database } from "@/integrations/supabase/types";

export type PipelineFase = Database["public"]["Tables"]["pipeline_configuraties"]["Row"];

/** Beschikbare kleurtokens voor pipeline-fases (Tailwind). */
export const PIPELINE_KLEUREN = [
  "slate", "blue", "cyan", "teal", "emerald",
  "amber", "orange", "rose", "violet", "fuchsia",
] as const;

export type PipelineKleur = typeof PIPELINE_KLEUREN[number];

/** Statische klasse-map zodat Tailwind ze niet purged. */
const KLEUR_MAP: Record<PipelineKleur, string> = {
  slate:   "bg-slate-100 text-slate-700 border-slate-200",
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  cyan:    "bg-cyan-100 text-cyan-700 border-cyan-200",
  teal:    "bg-teal-100 text-teal-700 border-teal-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  orange:  "bg-orange-100 text-orange-700 border-orange-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
  violet:  "bg-violet-100 text-violet-700 border-violet-200",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

export function kleurClasses(kleur: string): string {
  return KLEUR_MAP[(PIPELINE_KLEUREN as readonly string[]).includes(kleur)
    ? (kleur as PipelineKleur)
    : "slate"];
}

/** Standaard slugify voor handmatige fase-keys. */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "fase";
}