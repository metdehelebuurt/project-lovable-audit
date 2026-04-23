import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BulkGereedheid } from "@/hooks/installaties/useInstallatiesGereedheidBulk";

interface Props {
  data?: BulkGereedheid;
  loading?: boolean;
}

export default function InstallatieGereedheidsBar({ data, loading }: Props) {
  if (loading) {
    return <div className="h-2 w-24 rounded-full bg-muted animate-pulse" />;
  }
  if (!data || data.totaal === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const pct = Math.round((data.ok / data.totaal) * 100);
  const heeftBlokkades = data.blokkades > 0;
  const compleet = pct === 100;

  const barClass = cn(
    "h-full rounded-full transition-all",
    compleet ? "bg-emerald-500" : heeftBlokkades ? "bg-destructive" : "bg-primary"
  );

  const labelClass = cn(
    "text-[11px] font-medium tabular-nums",
    compleet ? "text-emerald-600" : heeftBlokkades ? "text-destructive" : "text-muted-foreground"
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[110px]">
            <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
              <div className={barClass} style={{ width: `${pct}%` }} />
            </div>
            <span className={labelClass}>{data.ok}/{data.totaal}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs space-y-0.5">
            <p>{data.ok} van {data.totaal} gereed ({pct}%)</p>
            {heeftBlokkades && (
              <p className="text-destructive font-medium">{data.blokkades} blokkerend(e) item(s)</p>
            )}
            {compleet && <p className="text-emerald-600 font-medium">Volledig voorbereid</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}