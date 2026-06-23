import type { Database } from "@/integrations/supabase/types";

export type PipelineFase = Database["public"]["Tables"]["pipeline_configuraties"]["Row"];

/** Beschikbare kleurtokens voor pipeline-fases (Tailwind). */
export const PIPELINE_KLEUREN = [
  "slate", "blue", "cyan", "teal", "emerald",
  "amber", "orange", "rose", "violet", "fuchsia",
] as const;

export type PipelineKleur = typeof PIPELINE_KLEUREN[number];

export function kleurClasses(kleur: string): string {
  const k = (PIPELINE_KLEUREN as readonly string[]).includes(kleur) ? kleur : "slate";
  return `bg-${k}-100 text-${k}-700 border-${k}-200`;
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