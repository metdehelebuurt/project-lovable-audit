import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Flame, Activity, Trophy, User } from "lucide-react";
import type { RepStats } from "@/hooks/sales/useTeamStats";

function euro(v: number) {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`;
  return `€${Math.round(v)}`;
}

interface Props { rep: RepStats }

export default function RepKaart({ rep }: Props) {
  const stoplicht = rep.stil7d > 5 || rep.nextActieTeLaat > 3 ? "rood" : rep.stil7d > 2 || rep.nextActieTeLaat > 0 ? "oranje" : "groen";
  const cls = stoplicht === "rood" ? "border-rose-300" : stoplicht === "oranje" ? "border-amber-300" : "border-emerald-300";

  return (
    <Card className={`${cls}`} data-testid="rep-kaart">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{rep.naam}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Leads" waarde={String(rep.totaal)} />
          <Stat label="Waarde" waarde={euro(rep.waarde)} />
          <Stat label="Heet/warm" waarde={String(rep.heet)} icon={<Flame className="h-3 w-3 text-rose-500" />} />
          <Stat label="Activiteit 7d" waarde={String(rep.activiteit7d)} icon={<Activity className="h-3 w-3 text-primary" />} />
          <Stat label="Gewonnen 30d" waarde={String(rep.gewonnen30d)} icon={<Trophy className="h-3 w-3 text-amber-500" />} />
          <Stat label="Conversie" waarde={`${rep.conversie30d}%`} />
        </div>
        {(rep.stil7d > 0 || rep.nextActieTeLaat > 0) && (
          <div className="flex flex-wrap gap-1 pt-1 border-t">
            {rep.stil7d > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                <AlertTriangle className="h-3 w-3" /> {rep.stil7d} stil ≥7d
              </Badge>
            )}
            {rep.nextActieTeLaat > 0 && (
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
                <AlertTriangle className="h-3 w-3" /> {rep.nextActieTeLaat} actie te laat
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, waarde, icon }: { label: string; waarde: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold flex items-center gap-1">{icon}{waarde}</div>
    </div>
  );
}