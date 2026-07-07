import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react";

type Score = "groen" | "oranje" | "rood" | string | null | undefined;

interface Props {
  score: Score;
  reden?: string | null;
  compact?: boolean;
}

const map = {
  groen: { label: "Op koers", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: ShieldCheck },
  oranje: { label: "Let op", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertCircle },
  rood: { label: "Risico", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: AlertTriangle },
} as const;

export default function RisicoBadge({ score, reden, compact }: Props) {
  if (!score || !(score in map)) return null;
  const s = map[score as keyof typeof map];
  const Icon = s.Icon;
  return (
    <Badge variant="outline" className={`gap-1 ${s.cls}`} title={reden ?? undefined}>
      <Icon className="h-3 w-3" />
      {compact ? s.label : `${s.label}${reden ? ` · ${reden}` : ""}`}
    </Badge>
  );
}