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
    <div className="space-y-3">
      <TemperatuurFilter waarde={tempFilter} onWijzig={setTempFilter} counts={tempCounts as never} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {fases.map((fase) => {
          const items = perFase[fase.fase_key] ?? [];
          return (
            <div key={fase.id} className="rounded-lg border bg-muted/30 flex flex-col min-h-[400px]">
              <div className={`px-3 py-2 border-b text-xs font-semibold sticky top-0 rounded-t-lg ${kleurClasses(fase.kleur)}`}>
                {fase.label} · {items.length}
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center pt-4">Leeg</p>
                ) : items.map((lead) => (
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