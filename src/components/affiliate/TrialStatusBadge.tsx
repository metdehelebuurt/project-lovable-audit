import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface Props {
  trialEinddatum?: string | null;
  compact?: boolean;
}

export function TrialStatusBadge({ trialEinddatum, compact }: Props) {
  const label = trialEinddatum
    ? `Trial actief — verloopt ${new Date(trialEinddatum).toLocaleDateString("nl-NL")}`
    : "Trial actief";
  return (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
      <Sparkles className="h-3 w-3 mr-1" />
      {compact ? "Trial" : label}
    </Badge>
  );
}