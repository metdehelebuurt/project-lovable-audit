import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Trophy, Layers } from "lucide-react";
import { useSalesLeads } from "@/hooks/sales/useSalesLeads";
import { berekenForecast, euro, winkansVoor } from "@/lib/sales/forecast";
import { useMemo } from "react";
import { FASE_LABEL } from "@/lib/sales/faseLabels";

export default function SalesForecast() {
  const { data: leads, isLoading } = useSalesLeads();
  const { perFase, totalen } = useMemo(() => berekenForecast(leads ?? []), [leads]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const maxWaarde = Math.max(1, ...perFase.map((f) => f.waarde));

  return (
    <div className="space-y-4" data-testid="sales-forecast">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Open pipeline" waarde={euro(totalen.totaal)} sub={`${totalen.aantalOpen} leads`} icon={<Layers className="h-4 w-4" />} />
        <Kpi label="Gewogen forecast" waarde={euro(totalen.gewogen)} sub="waarde × win-kans" icon={<TrendingUp className="h-4 w-4 text-primary" />} />
        <Kpi label="Gewonnen 30d" waarde={euro(totalen.gewonnen30d)} sub="laatst gemarkeerd gewonnen" icon={<Trophy className="h-4 w-4 text-amber-500" />} />
        <Kpi label="Dekking" waarde={`${Math.round((totalen.gewogen / Math.max(totalen.totaal, 1)) * 100)}%`} sub="gewogen / open" icon={<Target className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pipeline-gezondheid per fase</CardTitle>
        </CardHeader>
        <CardContent>
          {perFase.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nog geen open leads.</div>
          ) : (
            <div className="space-y-3" data-testid="forecast-per-fase">
              {perFase.map((f) => {
                const kansPct = Math.round(winkansVoor(f.fase) * 100);
                const barPct = Math.round((f.waarde / maxWaarde) * 100);
                const aging = f.gemiddeldeDagen;
                const agingKleur = aging > 30 ? "text-rose-600" : aging > 14 ? "text-amber-600" : "text-muted-foreground";
                return (
                  <div key={f.fase} className="space-y-1" data-testid={`fase-${f.fase}`}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{FASE_LABEL[f.fase as keyof typeof FASE_LABEL] ?? f.fase}</span>
                        <span className="text-xs text-muted-foreground">· {f.aantal} leads · kans {kansPct}%</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={agingKleur}>gem. {aging}d oud</span>
                        <span className="font-semibold">{euro(f.waarde)}</span>
                        <span className="text-primary font-semibold">→ {euro(f.gewogen)}</span>
                      </div>
                    </div>
                    <Progress value={barPct} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, waarde, sub, icon }: { label: string; waarde: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</div>
        <div className="text-2xl font-semibold mt-1">{waarde}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}