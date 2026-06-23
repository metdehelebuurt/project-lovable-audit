import { Card, CardContent } from "@/components/ui/card";
import { Phone, Calendar, Trophy, Clock, TrendingUp } from "lucide-react";
import { useBelStats } from "@/hooks/affiliate/useBelStats";

function formatDuur(s: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

type StatProps = { icon: React.ElementType; label: string; value: string | number; accent?: string };
function Stat({ icon: Icon, label, value, accent = "text-primary" }: StatProps) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-md bg-muted flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type Props = { queueCount: number };

export function BelStatsBalk({ queueCount }: Props) {
  const { data: stats } = useBelStats();
  return (
    <div className="flex flex-wrap gap-2">
      <Stat icon={Phone} label="In queue" value={queueCount} accent="text-blue-600" />
      <Stat icon={Phone} label="Vandaag gebeld" value={stats?.vandaagGebeld ?? 0} accent="text-indigo-600" />
      <Stat icon={Calendar} label="Afspraken" value={stats?.vandaagAfspraken ?? 0} accent="text-violet-600" />
      <Stat icon={Trophy} label="Gewonnen" value={stats?.vandaagGewonnen ?? 0} accent="text-emerald-600" />
      <Stat icon={Clock} label="Gem. duur" value={formatDuur(stats?.gemDuurSeconden ?? 0)} accent="text-amber-600" />
      <Stat icon={TrendingUp} label="Conversie" value={`${stats?.conversieRatio ?? 0}%`} accent="text-rose-600" />
    </div>
  );
}

export default BelStatsBalk;