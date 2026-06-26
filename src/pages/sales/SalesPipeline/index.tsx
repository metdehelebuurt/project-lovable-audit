import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesLeads, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { kleurClasses } from "@/lib/sales/pipeline";
import LeadKaart from "./LeadKaart";
import DoorzetDialog from "../DoorzetDialog";
import { Skeleton } from "@/components/ui/skeleton";
import TemperatuurFilter from "@/components/sales/TemperatuurFilter";
import type { Temperatuur } from "@/lib/sales/temperatuur";
import { Maximize2, Minimize2, TrendingUp, Users, Trophy, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatEuro(v: number): string {
  if (v >= 1_000_000) return `€ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€ ${(v / 1_000).toFixed(0)}k`;
  return `€ ${Math.round(v)}`;
}

export default function SalesPipeline() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useSalesLeads();
  const { data: pipeline, isLoading: pipelineLaadt } = useMyPipeline();
  const [toewijzenLead, setToewijzenLead] = useState<SalesLead | null>(null);
  const [tempFilter, setTempFilter] = useState<Temperatuur | "alle">("alle");
  const [uitgevouwen, setUitgevouwen] = useState<Set<string>>(new Set());
  const [allesUitgevouwen, setAllesUitgevouwen] = useState(false);

  const fases = useMemo(() => (pipeline ?? []).filter((f) => f.zichtbaar !== false), [pipeline]);

  const gefilterd = useMemo(() => {
    return (leads ?? []).filter((l) =>
      tempFilter === "alle" ? true : (l.temperatuur ?? "koud") === tempFilter,
    );
  }, [leads, tempFilter]);

  const perFase = useMemo(() => {
    const map: Record<string, SalesLead[]> = {};
    for (const f of fases) map[f.fase_key] = [];
    for (const l of gefilterd) {
      const key = l.fase_slug ?? "nieuw";
      if (!map[key]) map[key] = [];
      map[key].push(l);
    }
    return map;
  }, [gefilterd, fases]);

  const tempCounts = useMemo(() => {
    const c: Record<string, number> = { alle: (leads ?? []).length };
    for (const l of leads ?? []) {
      const t = (l.temperatuur ?? "koud") as string;
      c[t] = (c[t] ?? 0) + 1;
    }
    return c;
  }, [leads]);

  const kpis = useMemo(() => {
    const totaal = gefilterd.length;
    const waarde = gefilterd.reduce((s, l) => s + (Number(l.geschatte_waarde) || 0), 0);
    const gewonnen = gefilterd.filter((l) => (l.fase_slug ?? "") === "gewonnen").length;
    const verloren = gefilterd.filter((l) => (l.fase_slug ?? "") === "verloren").length;
    const afgerond = gewonnen + verloren;
    const conversie = afgerond > 0 ? Math.round((gewonnen / afgerond) * 100) : 0;
    return { totaal, waarde, gewonnen, conversie };
  }, [gefilterd]);

  const toggleFase = (key: string) => {
    setUitgevouwen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading || pipelineLaadt) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTegel icoon={Users} label="Actieve leads" waarde={String(kpis.totaal)} kleur="indigo" />
        <KpiTegel icoon={Euro} label="Pipeline waarde" waarde={formatEuro(kpis.waarde)} kleur="emerald" />
        <KpiTegel icoon={Trophy} label="Gewonnen" waarde={String(kpis.gewonnen)} kleur="amber" />
        <KpiTegel icoon={TrendingUp} label="Conversie" waarde={`${kpis.conversie}%`} kleur="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TemperatuurFilter waarde={tempFilter} onWijzig={setTempFilter} counts={tempCounts as never} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAllesUitgevouwen((v) => !v);
            setUitgevouwen(new Set());
          }}
          className="gap-2"
        >
          {allesUitgevouwen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {allesUitgevouwen ? "Lege fases inklappen" : "Alle fases tonen"}
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
        {fases.map((fase) => {
          const items = perFase[fase.fase_key] ?? [];
          const leeg = items.length === 0;
          const expand = allesUitgevouwen || uitgevouwen.has(fase.fase_key);
          if (leeg && !expand) {
            return (
              <button
                type="button"
                key={fase.id}
                onClick={() => toggleFase(fase.fase_key)}
                className="group w-[44px] shrink-0 snap-start rounded-xl border border-dashed bg-muted/20 hover:bg-muted/50 hover:border-solid transition-all min-h-[400px] flex flex-col items-center py-3 gap-3"
                title={`${fase.label} · klik om te openen`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${kleurClasses(fase.kleur)}`}>
                  0
                </div>
                <div
                  className="text-[11px] font-medium text-muted-foreground tracking-wide group-hover:text-foreground"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {fase.label}
                </div>
              </button>
            );
          }
          const faseWaarde = items.reduce((s, l) => s + (Number(l.geschatte_waarde) || 0), 0);
          return (
            <div key={fase.id} className="w-[300px] shrink-0 snap-start rounded-xl border bg-card flex flex-col min-h-[400px] shadow-sm">
              <div className={`px-3 py-2.5 border-b rounded-t-xl ${kleurClasses(fase.kleur)}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-wide truncate">{fase.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-semibold bg-background/70 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                    {!leeg && faseWaarde > 0 && (
                      <span className="text-[10px] font-medium bg-background/50 px-1.5 py-0.5 rounded-md">
                        {formatEuro(faseWaarde)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-2.5 space-y-2 flex-1 overflow-y-auto max-h-[72vh]">
                {items.length === 0 && (
                  <div className="text-center text-[11px] text-muted-foreground py-8 px-2">
                    Geen leads in deze fase
                  </div>
                )}
                {items.map((lead) => (
                  <LeadKaart
                    key={lead.id}
                    lead={lead}
                    onClick={() => navigate(`/sales/leads/${lead.id}`)}
                    onToewijzen={() => setToewijzenLead(lead)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <DoorzetDialog
        lead={toewijzenLead}
        open={!!toewijzenLead}
        onOpenChange={(o) => !o && setToewijzenLead(null)}
      />
    </div>
  );
}

function KpiTegel({
  icoon: Icoon,
  label,
  waarde,
  kleur,
}: {
  icoon: React.ComponentType<{ className?: string }>;
  label: string;
  waarde: string;
  kleur: "indigo" | "emerald" | "amber" | "violet";
}) {
  const kleurCls: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <div className="rounded-xl border bg-card p-3 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${kleurCls[kleur]}`}>
        <Icoon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-semibold leading-tight truncate">{waarde}</p>
      </div>
    </div>
  );
}