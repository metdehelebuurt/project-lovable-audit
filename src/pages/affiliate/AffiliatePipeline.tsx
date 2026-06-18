import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { NieuweLeadDialog } from "@/components/affiliate/NieuweLeadDialog";
import { PipelineKaart } from "@/components/affiliate/PipelineKaart";
import { LeadDetailDrawer } from "@/components/affiliate/LeadDetailDrawer";
import { STATUS_VOLGORDE, STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useAffiliateLeads, useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useRealtimeAffiliateLeads } from "@/hooks/affiliate/useRealtimeAffiliateLeads";

const ZICHTBARE_STATUSSEN: AffiliateLeadStatus[] = STATUS_VOLGORDE;

const AffiliatePipeline = () => {
  useRealtimeAffiliateLeads();
  const { data: leads = [] } = useAffiliateLeads("mine");
  const update = useUpdateAffiliateLead();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AffiliateLead | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<AffiliateLeadStatus, AffiliateLead[]>();
    ZICHTBARE_STATUSSEN.forEach((s) => m.set(s, []));
    leads.forEach((l) => m.get(l.status as AffiliateLeadStatus)?.push(l));
    return m;
  }, [leads]);

  const advance = (lead: AffiliateLead) => {
    const idx = ZICHTBARE_STATUSSEN.indexOf(lead.status as AffiliateLeadStatus);
    const next = ZICHTBARE_STATUSSEN[Math.min(idx + 1, ZICHTBARE_STATUSSEN.length - 3)];
    if (next) update.mutate({ id: lead.id, patch: { status: next } });
  };

  const exportCsv = () => {
    const headers = ["bedrijfsnaam", "contactpersoon", "email", "telefoon", "status", "geschatte_waarde", "volgende_actie_datum"];
    const rows = leads.map((l) => headers.map((h) => {
      const v = (l as Record<string, unknown>)[h];
      const s = v == null ? "" : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(";"));
    const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `pipeline-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Sales pipeline</h1>
          <p className="text-sm text-muted-foreground">{leads.length} leads in jouw pijplijn</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={leads.length === 0}><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nieuwe lead</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto">
        {ZICHTBARE_STATUSSEN.map((status) => {
          const items = grouped.get(status) ?? [];
          return (
            <div key={status} className="min-w-[220px] bg-muted/30 rounded-xl p-2 space-y-2">
              <div className="flex items-center justify-between px-1 py-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[status]}</h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              {items.length === 0 && <p className="text-xs text-muted-foreground px-1 py-4 text-center">Leeg</p>}
              {items.map((lead) => (
                <PipelineKaart
                  key={lead.id}
                  lead={lead}
                  onOpen={() => setSelected(lead)}
                  onAdvance={() => advance(lead)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <NieuweLeadDialog open={open} onOpenChange={setOpen} />
      <LeadDetailDrawer lead={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default AffiliatePipeline;