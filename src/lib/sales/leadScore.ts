import type { SalesLead } from "@/hooks/sales/useSalesLeads";

/** Combined score: 60% AI-score + 40% deterministische basis-score. */
export function gecombineerdeScore(lead: Pick<SalesLead, "ai_score" | "lead_score_basis">): number | null {
  const ai = typeof lead.ai_score === "number" ? lead.ai_score : null;
  const basis = typeof lead.lead_score_basis === "number" ? lead.lead_score_basis : null;
  if (ai == null && basis == null) return null;
  if (ai == null) return basis;
  if (basis == null) return ai;
  return Math.round(ai * 0.6 + basis * 0.4);
}

export function scoreKleur(score: number | null): string {
  if (score == null) return "bg-muted text-muted-foreground border-muted";
  if (score >= 70) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 40) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export function scoreLabel(score: number | null): string {
  if (score == null) return "—";
  if (score >= 70) return "Hot";
  if (score >= 40) return "Mid";
  return "Low";
}