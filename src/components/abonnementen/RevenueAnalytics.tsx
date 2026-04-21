import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Activity, Package } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface MoMPoint { maand: string; mrr: number; nieuw: number }
interface Metrics {
  mrr: number;
  arr: number;
  addonMrr: number;
  totalPartners: number;
  activePartners: number;
  trialPartners: number;
  churnedPartners: number;
  trialConversion: number;
  avgMrrPerPartner: number;
  revenuePerPlan: { plan: string; count: number; revenue: number }[];
  recentChanges: Array<{ id: string; type: string; created_at: string; partners?: { naam: string } | null }>;
  momData: MoMPoint[];
}

const EMPTY: Metrics = {
  mrr: 0, arr: 0, addonMrr: 0, totalPartners: 0, activePartners: 0,
  trialPartners: 0, churnedPartners: 0, trialConversion: 0, avgMrrPerPartner: 0,
  revenuePerPlan: [], recentChanges: [], momData: [],
};

const typeLabels: Record<string, string> = {
  aangemaakt: "Nieuw", upgrade: "Upgrade", downgrade: "Downgrade",
  opgezegd: "Opgezegd", verlengd: "Verlengd", korting: "Korting",
  betaling: "Betaling", bewerkt: "Bewerkt",
};

export default function RevenueAnalytics() {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const [{ data: abos }, { data: wijzigingen }, { data: addons }] = await Promise.all([
        supabase.from("abonnementen").select("*, abonnement_plannen(naam, maand_prijs), partners(naam)"),
        supabase.from("abonnement_wijzigingen").select("id, type, created_at, partners(naam)").order("created_at", { ascending: false }).limit(20),
        supabase.from("abonnement_addon_aankopen").select("maand_bedrag, status").eq("status", "actief"),
      ]);

      if (!abos) { setLoading(false); return; }

      const active = abos.filter((a) => a.status === "actief");
      const trials = abos.filter((a) => a.status === "trial");
      const churned = abos.filter((a) => a.status === "opgezegd" || a.status === "verlopen");

      const mrr = active.reduce((sum, a) => sum + (a.maand_bedrag || 0), 0);
      const addonMrr = (addons ?? []).reduce((sum, a) => sum + (a.maand_bedrag || 0), 0);

      // Trial-conversie: partners die ooit trial waren EN nu actief zijn / totaal partners die ooit trial waren
      // Proxy: alle abonnementen die niet 'actief' direct gestart zijn maar wel ooit trial-plan hadden
      const partnerIdsTrialEver = new Set(
        abos.filter((a) => a.plan === "trial" || a.status === "trial").map((a) => a.partner_id)
      );
      const partnerIdsConverted = new Set(
        active.filter((a) => partnerIdsTrialEver.has(a.partner_id) && a.plan !== "trial").map((a) => a.partner_id)
      );
      const conversionRate = partnerIdsTrialEver.size > 0
        ? Math.round((partnerIdsConverted.size / partnerIdsTrialEver.size) * 100)
        : 0;

      // Omzet per plan
      const planMap = new Map<string, { count: number; revenue: number }>();
      active.forEach((a) => {
        const planNaam = (a.abonnement_plannen as { naam?: string } | null)?.naam ?? a.plan ?? "Onbekend";
        const existing = planMap.get(planNaam) ?? { count: 0, revenue: 0 };
        planMap.set(planNaam, { count: existing.count + 1, revenue: existing.revenue + (a.maand_bedrag || 0) });
      });

      // MoM (laatste 6 maanden) — MRR-snapshot benadering
      const momData: MoMPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const maand = subMonths(new Date(), i);
        const start = startOfMonth(maand);
        const end = endOfMonth(maand);
        const actiefInMaand = abos.filter((a) => {
          const startedBefore = new Date(a.start_datum) <= end;
          const notCancelledYet = !a.opzeg_datum || new Date(a.opzeg_datum) > start;
          return startedBefore && notCancelledYet && (a.status === "actief" || a.status === "opgezegd");
        });
        const nieuwInMaand = abos.filter((a) => {
          const startDate = new Date(a.start_datum);
          return startDate >= start && startDate <= end;
        });
        momData.push({
          maand: format(maand, "MMM", { locale: nl }),
          mrr: actiefInMaand.reduce((s, a) => s + (a.maand_bedrag || 0), 0),
          nieuw: nieuwInMaand.length,
        });
      }

      setMetrics({
        mrr, arr: mrr * 12, addonMrr,
        totalPartners: abos.length,
        activePartners: active.length,
        trialPartners: trials.length,
        churnedPartners: churned.length,
        trialConversion: conversionRate,
        avgMrrPerPartner: active.length > 0 ? Math.round(mrr / active.length) : 0,
        revenuePerPlan: Array.from(planMap.entries()).map(([plan, data]) => ({ plan, ...data })),
        recentChanges: (wijzigingen ?? []) as Metrics["recentChanges"],
        momData,
      });
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  const kpiCards = [
    { label: "MRR", value: `€${metrics.mrr.toFixed(0)}`, icon: DollarSign, color: "text-green-600" },
    { label: "ARR", value: `€${metrics.arr.toFixed(0)}`, icon: TrendingUp, color: "text-blue-600" },
    { label: "Add-on MRR", value: `€${metrics.addonMrr.toFixed(0)}`, icon: Package, color: "text-purple-600" },
    { label: "Avg/partner", value: `€${metrics.avgMrrPerPartner}`, icon: BarChart3, color: "text-cyan-600" },
    { label: "Actief", value: metrics.activePartners.toString(), icon: Users, color: "text-primary" },
    { label: "Trial", value: metrics.trialPartners.toString(), icon: Activity, color: "text-orange-600" },
    { label: "Churn", value: metrics.churnedPartners.toString(), icon: TrendingDown, color: "text-red-600" },
    { label: "Trial→Betaald", value: `${metrics.trialConversion}%`, icon: BarChart3, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiCards.map((kpi) => (
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

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">MRR-trend (6 maanden)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.momData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="maand" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value: number, name: string) => [name === "mrr" ? `€${value}` : value, name === "mrr" ? "MRR" : "Nieuwe partners"]}
                />
                <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="nieuw" stroke="hsl(var(--secondary-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Omzet per plan</CardTitle></CardHeader>
          <CardContent>
            {metrics.revenuePerPlan.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen data</p>
            ) : (
              <div className="space-y-3">
                {metrics.revenuePerPlan.map((r) => (
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
                {metrics.recentChanges.map((c) => (
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
