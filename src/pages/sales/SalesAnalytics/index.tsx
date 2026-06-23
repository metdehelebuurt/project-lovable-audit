import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useSalesLeads } from "@/hooks/sales/useSalesLeads";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { SALES_FASES, FASE_LABEL, FASE_COLOR, type SalesFase } from "@/lib/sales/faseLabels";
import { Badge } from "@/components/ui/badge";

export default function SalesAnalytics() {
  const { data: leads } = useSalesLeads();
  const { data: affiliates } = useAffiliateGebruikers();

  const stats = useMemo(() => {
    const perFase: Record<SalesFase, number> = {
      koud: 0, benaderd: 0, warm: 0, gekwalificeerd: 0, doorgezet: 0, gewonnen: 0, verloren: 0,
    };
    const perAffiliate = new Map<string, { gewonnen: number; doorgezet: number; waarde: number }>();
    let totaalWaardeGewonnen = 0;
    for (const l of leads ?? []) {
      const f = (l.sales_fase ?? "koud") as SalesFase;
      perFase[f] = (perFase[f] ?? 0) + 1;
      if (l.eigenaar_id) {
        const k = l.eigenaar_id;
        const cur = perAffiliate.get(k) ?? { gewonnen: 0, doorgezet: 0, waarde: 0 };
        if (f === "doorgezet" || f === "gewonnen") cur.doorgezet += 1;
        if (f === "gewonnen") {
          cur.gewonnen += 1;
          cur.waarde += Number(l.geschatte_waarde ?? 0);
          totaalWaardeGewonnen += Number(l.geschatte_waarde ?? 0);
        }
        perAffiliate.set(k, cur);
      }
    }
    return { perFase, perAffiliate, totaalWaardeGewonnen, totaal: leads?.length ?? 0 };
  }, [leads]);

  const naamVoor = (id: string) =>
    affiliates?.find((a) => a.id === id)?.naam ?? id.slice(0, 8);

  const top = Array.from(stats.perAffiliate.entries())
    .sort((a, b) => b[1].waarde - a[1].waarde)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Totaal leads</div>
          <div className="text-2xl font-semibold mt-1">{stats.totaal}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Doorgezet</div>
          <div className="text-2xl font-semibold mt-1">{stats.perFase.doorgezet}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Gewonnen</div>
          <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.perFase.gewonnen}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Omzet gewonnen</div>
          <div className="text-2xl font-semibold mt-1">€{stats.totaalWaardeGewonnen.toLocaleString("nl-NL")}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Verdeling per fase</h3>
        <div className="space-y-2">
          {SALES_FASES.map((f) => {
            const c = stats.perFase[f];
            const pct = stats.totaal > 0 ? (c / stats.totaal) * 100 : 0;
            return (
              <div key={f} className="flex items-center gap-3">
                <Badge variant="outline" className={`${FASE_COLOR[f]} w-32 justify-start`}>{FASE_LABEL[f]}</Badge>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-sm w-12 text-right">{c}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Top affiliates op gewonnen waarde</h3>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen gewonnen leads.</p>
        ) : (
          <div className="space-y-2">
            {top.map(([id, s]) => (
              <div key={id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <span className="font-medium">{naamVoor(id)}</span>
                <span className="text-muted-foreground">{s.gewonnen} gewonnen · {s.doorgezet} doorgezet</span>
                <span className="font-semibold">€{s.waarde.toLocaleString("nl-NL")}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}