import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, GitMerge, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuplicatenVoorLead } from "./useDuplicaten";
import { useNegeerDuplicaat } from "./useNegeerDuplicaat";
import { MergeDialog } from "./MergeDialog";
import { REDEN_LABELS, type LeadLite } from "./types";

interface Props {
  leadId: string;
}

export function DuplicaatWaarschuwing({ leadId }: Props) {
  const { data = [], isLoading } = useDuplicatenVoorLead(leadId);
  const negeer = useNegeerDuplicaat();
  const navigate = useNavigate();
  const [mergePair, setMergePair] = useState<{ a: LeadLite; b: LeadLite } | null>(null);

  if (isLoading || data.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-warning/40 bg-warning-light/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" />
          <p className="text-sm font-medium">
            {data.length === 1 ? "Mogelijk duplicaat gevonden" : `${data.length} mogelijke duplicaten gevonden`}
          </p>
        </div>
        <div className="space-y-2">
          {data.map((p) => {
            const ander = p.lead_a_id === leadId ? p.lead_b : p.lead_a;
            const huidig = p.lead_a_id === leadId ? p.lead_a : p.lead_b;
            if (!ander || !huidig) return null;
            return (
              <div key={`${p.lead_a_id}-${p.lead_b_id}`} className="rounded-lg bg-background border p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium">{ander.voornaam} {ander.achternaam}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[ander.email, ander.telefoon].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Matcht op {p.match_redenen.map((r) => REDEN_LABELS[r] ?? r).join(", ")} ·
                    {" "}Aangemaakt {new Date(ander.created_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(`/leads/${ander.id}`)}>
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5"
                  onClick={() => negeer.mutate({ leadAId: p.lead_a_id, leadBId: p.lead_b_id })}
                  disabled={negeer.isPending}
                >
                  <X className="h-3.5 w-3.5" /> Geen duplicaat
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => setMergePair({ a: huidig, b: ander })}>
                  <GitMerge className="h-3.5 w-3.5" /> Samenvoegen
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {mergePair && (
        <MergeDialog
          open={!!mergePair}
          onOpenChange={(v) => { if (!v) setMergePair(null); }}
          leadA={mergePair.a}
          leadB={mergePair.b}
          onMerged={(keptId) => {
            setMergePair(null);
            if (keptId !== leadId) navigate(`/leads/${keptId}`);
          }}
        />
      )}
    </>
  );
}