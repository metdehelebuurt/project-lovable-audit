import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useSalesLeads } from "@/hooks/sales/useSalesLeads";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import { kleurClasses } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, TEMP_COLOR, type Temperatuur } from "@/lib/sales/temperatuur";
import { Badge } from "@/components/ui/badge";

export default function SalesAnalytics() {
  const { data: leads } = useSalesLeads();
  const { data: affiliates } = useAffiliateGebruikers();
  const { data: pipeline } = useMyPipeline();
  const { data: bronnenLijst } = useLeadBronnen();

  const bronLabel = (slug: string) =>
    bronnenLijst?.find((b) => b.slug === slug || b.id === slug)?.label ?? slug;

  const fases = useMemo(() => (pipeline ?? []).filter((f) => f.zichtbaar !== false), [pipeline]);

  const stats = useMemo(() => {
    const perFase: Record<string, number> = {};
    const perTemp: Record<Temperatuur, { totaal: number; gewonnen: number; waarde: number }> = {
      koud: { totaal: 0, gewonnen: 0, waarde: 0 },
      lauw: { totaal: 0, gewonnen: 0, waarde: 0 },
      warm: { totaal: 0, gewonnen: 0, waarde: 0 },
      heet: { totaal: 0, gewonnen: 0, waarde: 0 },
    };
    const perBron = new Map<string, number>();
    const perAffiliate = new Map<string, { gewonnen: number; doorgezet: number; waarde: number }>();
    let totaalWaardeGewonnen = 0;
    let aantalGewonnen = 0;
    let aantalVerloren = 0;

    const wonKeys = new Set(fases.filter((f) => f.is_won).map((f) => f.fase_key));
    const eindKeys = new Set(fases.filter((f) => f.is_eindfase).map((f) => f.fase_key));

    for (const l of leads ?? []) {
      const slug = l.fase_slug ?? "nieuw";
      perFase[slug] = (perFase[slug] ?? 0) + 1;
      const t = (l.temperatuur ?? "koud") as Temperatuur;
      perTemp[t].totaal += 1;
      perBron.set(l.bron ?? "onbekend", (perBron.get(l.bron ?? "onbekend") ?? 0) + 1);

      const isWon = wonKeys.has(slug);
      const isVerloren = eindKeys.has(slug) && !isWon;
      if (isWon) {
        aantalGewonnen += 1;
        perTemp[t].gewonnen += 1;
        perTemp[t].waarde += Number(l.geschatte_waarde ?? 0);
        totaalWaardeGewonnen += Number(l.geschatte_waarde ?? 0);
      }
      if (isVerloren) aantalVerloren += 1;

      if (l.eigenaar_id) {
        const k = l.eigenaar_id;
        const cur = perAffiliate.get(k) ?? { gewonnen: 0, doorgezet: 0, waarde: 0 };
        cur.doorgezet += 1;
        if (isWon) {
          cur.gewonnen += 1;
          cur.waarde += Number(l.geschatte_waarde ?? 0);
        }
        perAffiliate.set(k, cur);
      }
    }
    const totaal = leads?.length ?? 0;
    const conversie = aantalGewonnen + aantalVerloren > 0
      ? (aantalGewonnen / (aantalGewonnen + aantalVerloren)) * 100
      : 0;

    // Leads zonder contact > 14 dagen
    const drempel = Date.now() - 14 * 86400000;
    const noTouch = (leads ?? []).filter((l) => {
      const upd = l.updated_at ? new Date(l.updated_at).getTime() : 0;
      return upd < drempel && !l.fase_slug?.includes("won") && !l.fase_slug?.includes("verloren");
    }).length;
    return { perFase, perTemp, perBron, perAffiliate, totaalWaardeGewonnen, aantalGewonnen, aantalVerloren, conversie, totaal, noTouch };
  }, [leads, fases]);

  const naamVoor = (id: string) =>
    affiliates?.find((a) => a.id === id)?.naam ?? id.slice(0, 8);

  const top = Array.from(stats.perAffiliate.entries())
    .sort((a, b) => b[1].waarde - a[1].waarde)
    .slice(0, 10);

  const bronnen = Array.from(stats.perBron.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Totaal leads</div>
          <div className="text-2xl font-semibold mt-1">{stats.totaal}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Conversie</div>
          <div className="text-2xl font-semibold mt-1">{stats.conversie.toFixed(0)}%</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {stats.aantalGewonnen} won / {stats.aantalVerloren} verloren
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Stil &gt; 14d</div>
          <div className="text-2xl font-semibold mt-1 text-amber-600">{stats.noTouch}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">leads zonder contact</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Omzet gewonnen</div>
          <div className="text-2xl font-semibold mt-1">€{stats.totaalWaardeGewonnen.toLocaleString("nl-NL")}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Conversie per temperatuur</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TEMPERATUREN.map((t) => {
            const s = stats.perTemp[t];
            const pct = s.totaal > 0 ? (s.gewonnen / s.totaal) * 100 : 0;
            return (
              <div key={t} className={`rounded-md border p-3 ${TEMP_COLOR[t]}`}>
                <div className="text-xs font-medium">{TEMP_LABEL[t]}</div>
                <div className="text-xl font-semibold mt-1">{pct.toFixed(0)}%</div>
                <div className="text-[11px] mt-0.5 opacity-80">
                  {s.gewonnen}/{s.totaal} · €{s.waarde.toLocaleString("nl-NL")}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Funnel per fase</h3>
        <div className="space-y-2">
          {fases.map((f) => {
            const c = stats.perFase[f.fase_key] ?? 0;
            const pct = stats.totaal > 0 ? (c / stats.totaal) * 100 : 0;
            return (
              <div key={f.id} className="flex items-center gap-3">
                <Badge variant="outline" className={`${kleurClasses(f.kleur)} w-36 justify-start`}>{f.label}</Badge>
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
        <h3 className="font-semibold mb-3">Leads per bron</h3>
        {bronnen.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen data.</p>
        ) : (
          <div className="space-y-2">
            {bronnen.map(([bron, n]) => {
              const pct = stats.totaal > 0 ? (n / stats.totaal) * 100 : 0;
              return (
                <div key={bron} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate">{bronLabel(bron)}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">{n}</span>
                </div>
              );
            })}
          </div>
        )}
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