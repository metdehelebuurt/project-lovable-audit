import { useMemo, useState } from "react";
import { useSalesLeads, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { SALES_FASES, FASE_LABEL, FASE_COLOR, type SalesFase } from "@/lib/sales/faseLabels";
import LeadKaart from "./LeadKaart";
import LeadDetailDrawer from "../LeadDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesPipeline() {
  const { data: leads, isLoading } = useSalesLeads();
  const [openLead, setOpenLead] = useState<SalesLead | null>(null);

  const perFase = useMemo(() => {
    const map: Record<SalesFase, SalesLead[]> = {
      koud: [], benaderd: [], warm: [], gekwalificeerd: [], doorgezet: [], gewonnen: [], verloren: [],
    };
    for (const l of leads ?? []) {
      const f = (l.sales_fase ?? "koud") as SalesFase;
      if (map[f]) map[f].push(l);
    }
    return map;
  }, [leads]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {SALES_FASES.map((f) => <Skeleton key={f} className="h-64" />)}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {SALES_FASES.map((fase) => (
          <div key={fase} className="rounded-lg border bg-muted/30 flex flex-col min-h-[400px]">
            <div className={`px-3 py-2 border-b text-xs font-semibold sticky top-0 rounded-t-lg ${FASE_COLOR[fase]}`}>
              {FASE_LABEL[fase]} · {perFase[fase].length}
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
              {perFase[fase].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center pt-4">Leeg</p>
              ) : perFase[fase].map((lead) => (
                <LeadKaart key={lead.id} lead={lead} onClick={() => setOpenLead(lead)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <LeadDetailDrawer
        lead={openLead}
        open={!!openLead}
        onOpenChange={(o) => !o && setOpenLead(null)}
      />
    </>
  );
}