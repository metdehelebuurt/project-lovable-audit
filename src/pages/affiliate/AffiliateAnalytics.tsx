import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, X, Euro, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useAffiliateLeads } from "@/hooks/affiliate/useAffiliateLeads";
import { useAffiliateTargets } from "@/hooks/affiliate/useAffiliateTargets";
import { useAuth } from "@/contexts/AuthContext";

const fmtEur = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const AffiliateAnalytics = () => {
  const { data: leads = [], isLoading } = useAffiliateLeads("mine");
  const { user } = useAuth();
  const { data: targets = [] } = useAffiliateTargets(user?.id);

  const stats = useMemo(() => {
    const gewonnen = leads.filter((l) => l.status === "gewonnen");
    const verloren = leads.filter((l) => l.status === "verloren");
    const open = leads.filter((l) => !["gewonnen", "verloren"].includes(l.status));
    const totaalWaarde = open.reduce((s, l) => s + Number(l.geschatte_waarde ?? 0), 0);
    const gewonnenWaarde = gewonnen.reduce((s, l) => s + Number(l.geschatte_waarde ?? 0), 0);
    const winRate = gewonnen.length + verloren.length === 0
      ? 0
      : Math.round((gewonnen.length / (gewonnen.length + verloren.length)) * 100);
    return { gewonnen, verloren, open, totaalWaarde, gewonnenWaarde, winRate };
  }, [leads]);

  const verliesRedenen = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of stats.verloren) {
      const k = l.verloren_reden?.trim() || "Onbekend";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [stats.verloren]);

  const targetVoortgang = useMemo(() => {
    const nu = new Date();
    const jaar = nu.getFullYear();
    const maand = nu.getMonth() + 1;
    const target = targets.find((t) => t.jaar === jaar && t.maand === maand);
    if (!target) return null;
    const startMaand = new Date(jaar, maand - 1, 1).getTime();
    const gewonnenDezeMaand = stats.gewonnen.filter((l) => {
      const d = l.updated_at ? new Date(l.updated_at).getTime() : 0;
      return d >= startMaand;
    });
    const aantal = gewonnenDezeMaand.length;
    const omzet = gewonnenDezeMaand.reduce((s, l) => s + Number(l.geschatte_waarde ?? 0), 0);
    const aantalDoel = Number(target.target_klanten ?? 0);
    const omzetDoel = Number(target.target_omzet ?? 0);
    return {
      jaar,
      maand,
      aantal,
      aantalDoel,
      omzet,
      omzetDoel,
      aantalPct: aantalDoel > 0 ? Math.min(100, Math.round((aantal / aantalDoel) * 100)) : 0,
      omzetPct: omzetDoel > 0 ? Math.min(100, Math.round((omzet / omzetDoel) * 100)) : 0,
    };
  }, [targets, stats.gewonnen]);

  return (
    <div className="p-6 space-y-4">
      <AffiliateSubnav />
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Inzicht in je pipeline-prestaties</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Target className="h-7 w-7 text-blue-600" /><div><p className="text-2xl font-bold">{stats.open.length}</p><p className="text-xs text-muted-foreground">Open leads</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Euro className="h-7 w-7 text-indigo-600" /><div><p className="text-2xl font-bold">{fmtEur(stats.totaalWaarde)}</p><p className="text-xs text-muted-foreground">Open pipeline-waarde</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Trophy className="h-7 w-7 text-emerald-600" /><div><p className="text-2xl font-bold">{stats.gewonnen.length}</p><p className="text-xs text-muted-foreground">Gewonnen ({fmtEur(stats.gewonnenWaarde)})</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-7 w-7 text-amber-600" /><div><p className="text-2xl font-bold">{stats.winRate}%</p><p className="text-xs text-muted-foreground">Win-rate</p></div></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><X className="h-4 w-4 text-rose-500" /> Verlies-analyse</CardTitle></CardHeader>
            <CardContent>
              {verliesRedenen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen verloren leads — top!</p>
              ) : (
                <ul className="space-y-2">
                  {verliesRedenen.map(([reden, n]) => (
                    <li key={reden} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <span className="text-sm">{reden}</span>
                      <Badge variant="outline">{n}×</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AffiliateAnalytics;
