import { Sparkles } from "lucide-react";
import { gecombineerdeScore, scoreKleur, scoreLabel } from "@/lib/sales/leadScore";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import { cn } from "@/lib/utils";

interface Props {
  lead: Pick<SalesLead, "ai_score" | "lead_score_basis">;
  showLabel?: boolean;
  className?: string;
}

export default function LeadScorePill({ lead, showLabel = true, className }: Props) {
  const score = gecombineerdeScore(lead);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        scoreKleur(score),
        className,
      )}
      aria-label={`Lead-score ${score ?? "onbekend"}`}
      title={`Lead-score: ${score ?? "—"}/100`}
    >
      <Sparkles className="h-3 w-3" />
      {score ?? "—"}
      {showLabel && <span className="opacity-80">{scoreLabel(score)}</span>}
    </span>
  );
}