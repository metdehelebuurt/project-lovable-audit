import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Activity } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Metrics {
  mrr: number;
  arr: number;
  totalPartners: number;
  activePartners: number;
  trialPartners: number;
  churnedPartners: number;
  trialConversion: number;
  revenuePerPlan: { plan: string; count: number; revenue: number }[];
  recentChanges: { type: string; details: any; created_at: string; partners?: { naam: string } }[];
}

export default function RevenueAnalytics() {
  const [metrics, setMetrics] = useState<Metrics>({
    mrr: 0, arr: 0, totalPartners: 0, activePartners: 0,
    trialPartners: 0, churnedPartners: 0, trialConversion: 0,
    revenuePerPlan: [], recentChanges: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const [{ data: abos }, { data: wijzigingen }, { data: plannen }] = await Promise.all([
        supabase.from("abonnementen").select("*, abonnement_plannen(naam, maand_prijs), partners(naam)"),
        supabase.from("abonnement_wijzigingen").select("*, partners(naam)").order("created_at", { ascending: false }).limit(20),
        supabase.from("abonnement_plannen").select("*").order("volgorde"),
      ]);

      if (!abos) { setLoading(false); return; }

      const active = abos.filter(a => a.status === "actief");
      const trials = abos.filter(a => a.status === "trial");
      const churned = abos.filter(a => a.status === "opgezegd" || a.status === "verlopen");

      const mrr = active.reduce((sum, a) => sum + (a.maand_bedrag || 0), 0);

      // Revenue per plan
      const planMap = new Map<string, { count: number; revenue: number }>();
      active.forEach(a => {
        const planNaam = (a as any).abonnement_plannen?.naam ?? a.plan ?? "Onbekend";
        const existing = planMap.get(planNaam) || { count: 0, revenue: 0 };
        planMap.set(planNaam, { count: existing.count + 1, revenue: existing.revenue + (a.maand_bedrag || 0) });
      });

      // Trial conversion: how many ex-trials are now active
      const totalTrialEver = abos.filter(a => a.plan === "trial" || a.status === "trial" || active.some(ac => ac.partner_id === a.partner_id)).length;
      const converted = active.filter(a => a.plan !== "trial").length;
      const conversionRate = totalTrialEver > 0 ? (converted / totalTrialEver) * 100 : 0;

      setMetrics({
        mrr,
        arr: mrr * 12,
        totalPartners: abos.length,
        activePartners: active.length,
        trialPartners: trials.length,
        churnedPartners: churned.length,
        trialConversion: Math.round(conversionRate),
        revenuePerPlan: Array.from(planMap.entries()).map(([plan, data]) => ({ plan, ...data })),
        recentChanges: (wijzigingen as any) ?? [],
      });
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  const kpiCards = [
    { label: "MRR", value: `€${metrics.mrr.toFixed(0)}`, icon: DollarSign, color: "text-green-600" },
    { label: "ARR", value: `€${metrics.arr.toFixed(0)}`, icon: TrendingUp, color: "text-blue-600" },
    { label: "Actieve partners", value: metrics.activePartners.toString(), icon: Users, color: "text-primary" },
    { label: "Trial partners", value: metrics.trialPartners.toString(), icon: Activity, color: "text-orange-600" },
    { label: "Churn", value: metrics.churnedPartners.toString(), icon: TrendingDown, color: "text-red-600" },
    { label: "Trial → Betaald", value: `${metrics.trialConversion}%`, icon: BarChart3, color: "text-emerald-600" },
  ];

  const typeLabels: Record<string, string> = {
    aangemaakt: "Nieuw", upgrade: "Upgrade", downgrade: "Downgrade",
    opgezegd: "Opgezegd", verlengd: "Verlengd", korting: "Korting",
    betaling: "Betaling", bewerkt: "Bewerkt",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map(kpi => (
          <Card key={kpi.label} className="rounded-2xl">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Omzet per plan</CardTitle></CardHeader>
          <CardContent>
            {metrics.revenuePerPlan.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen data</p>
            ) : (
              <div className="space-y-3">
                {metrics.revenuePerPlan.map(r => (
                  <div key={r.plan} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.plan}</p>
                      <p className="text-xs text-muted-foreground">{r.count} partner(s)</p>
                    </div>
                    <p className="text-sm font-bold">€{r.revenue.toFixed(0)}/mnd</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Recente activiteit</CardTitle></CardHeader>
          <CardContent>
            {metrics.recentChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen recente wijzigingen</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {metrics.recentChanges.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2 text-sm border-b border-muted pb-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                      {typeLabels[c.type] ?? c.type}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-foreground truncate">{c.partners?.naam ?? "Onbekend"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
