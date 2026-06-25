/**
 * Mapping van kleur-token (zoals opgeslagen in affiliate_pipeline_config.kleur)
 * naar volledige Tailwind classes. Statisch zodat Tailwind ze niet purged.
 */
export const PIPELINE_KLEUREN = [
  "slate", "blue", "cyan", "teal", "emerald",
  "amber", "orange", "rose", "violet", "fuchsia",
  "sky", "indigo",
] as const;

export type PipelineKleur = (typeof PIPELINE_KLEUREN)[number];

type KleurClasses = {
  /** Tailwind achtergrond + tekst voor pillen/badges. */
  badge: string;
  /** Volle dot-achtergrond. */
  dot: string;
  /** Border / linker-streep. */
  border: string;
};

const MAP: Record<PipelineKleur, KleurClasses> = {
  slate:   { badge: "bg-slate-100 text-slate-700 border-slate-200",       dot: "bg-slate-500",   border: "border-slate-300" },
  blue:    { badge: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500",    border: "border-blue-300" },
  cyan:    { badge: "bg-cyan-100 text-cyan-700 border-cyan-200",          dot: "bg-cyan-500",    border: "border-cyan-300" },
  teal:    { badge: "bg-teal-100 text-teal-700 border-teal-200",          dot: "bg-teal-500",    border: "border-teal-300" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", border: "border-emerald-300" },
  amber:   { badge: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500",   border: "border-amber-300" },
  orange:  { badge: "bg-orange-100 text-orange-700 border-orange-200",    dot: "bg-orange-500",  border: "border-orange-300" },
  rose:    { badge: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-500",    border: "border-rose-300" },
  violet:  { badge: "bg-violet-100 text-violet-700 border-violet-200",    dot: "bg-violet-500",  border: "border-violet-300" },
  fuchsia: { badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", dot: "bg-fuchsia-500", border: "border-fuchsia-300" },
  sky:     { badge: "bg-sky-100 text-sky-700 border-sky-200",             dot: "bg-sky-500",     border: "border-sky-300" },
  indigo:  { badge: "bg-indigo-100 text-indigo-700 border-indigo-200",    dot: "bg-indigo-500",  border: "border-indigo-300" },
};

function normalize(k: string): PipelineKleur {
  return (PIPELINE_KLEUREN as readonly string[]).includes(k) ? (k as PipelineKleur) : "slate";
}

export function kleurBadge(kleur: string): string {
  return MAP[normalize(kleur)].badge;
}

export function kleurDot(kleur: string): string {
  return MAP[normalize(kleur)].dot;
}

export function kleurBorder(kleur: string): string {
  return MAP[normalize(kleur)].border;
}