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

export default function SalesPipeline() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useSalesLeads();
  const { data: pipeline, isLoading: pipelineLaadt } = useMyPipeline();
  const [toewijzenLead, setToewijzenLead] = useState<SalesLead | null>(null);
  const [tempFilter, setTempFilter] = useState<Temperatuur | "alle">("alle");

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

  if (isLoading || pipelineLaadt) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TemperatuurFilter waarde={tempFilter} onWijzig={setTempFilter} counts={tempCounts as never} />
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
        {fases.map((fase) => {
          const items = perFase[fase.fase_key] ?? [];
          const leeg = items.length === 0;
          if (leeg) {
            return (
              <div
                key={fase.id}
                className="w-[60px] shrink-0 snap-start rounded-xl border border-dashed bg-muted/20 flex flex-col items-center justify-start py-3 gap-2 hover:bg-muted/40 transition-colors min-h-[400px]"
                title={`${fase.label} · leeg`}
              >
                <div className={`px-2 py-1 rounded-md text-[10px] font-semibold ${kleurClasses(fase.kleur)}`}>0</div>
                <div
                  className="text-[11px] font-medium text-muted-foreground tracking-wide"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {fase.label}
                </div>
              </div>
            );
          }
          return (
            <div key={fase.id} className="w-[300px] shrink-0 snap-start rounded-xl border bg-card flex flex-col min-h-[400px] shadow-sm">
              <div className={`flex items-center justify-between px-3 py-2.5 border-b rounded-t-xl ${kleurClasses(fase.kleur)}`}>
                <span className="text-xs font-semibold tracking-wide">{fase.label}</span>
                <span className="text-[11px] font-semibold bg-background/60 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="p-2.5 space-y-2 flex-1 overflow-y-auto max-h-[72vh]">
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