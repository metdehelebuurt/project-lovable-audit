import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, TrendingUp, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDagelijkseBriefing, useRefreshBriefing } from "@/hooks/sales/useDagelijkseBriefing";

export default function DagelijkseBriefing() {
  const { data, isLoading } = useDagelijkseBriefing();
  const refresh = useRefreshBriefing();

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="briefing-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI ochtendbriefing
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="gap-1"
          aria-label="Briefing vernieuwen"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`} />
          Vernieuwen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            {data?.headline && <p className="font-medium">{data.headline}</p>}
            {data?.highlights && data.highlights.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Highlights
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}
            {data?.acties && data.acties.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" /> Acties vandaag
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {data.acties.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {!data?.headline && !isLoading && (
              <p className="italic text-muted-foreground">Nog geen briefing. Klik op "Vernieuwen" om er een te genereren.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}