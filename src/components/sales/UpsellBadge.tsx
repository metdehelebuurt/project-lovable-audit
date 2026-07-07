import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  label?: string;
  toelichting?: string;
  compact?: boolean;
}

/** Klein signaal-badge dat een upsell-mogelijkheid aanduidt (bv. Smartaccu). */
export default function UpsellBadge({
  label = "Upsell: Smartaccu",
  toelichting = "Deze klant heeft nog geen Smartaccu-addon actief — commerciële kans.",
  compact = false,
}: Props) {
  const badge = (
    <Badge
      variant="outline"
      className={`gap-1 border-violet-300 bg-violet-50 text-violet-800 ${compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]"}`}
    >
      <Zap className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
    </Badge>
  );
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top">{toelichting}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}