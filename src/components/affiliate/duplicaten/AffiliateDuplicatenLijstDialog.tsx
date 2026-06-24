import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitMerge, X, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAffiliateDuplicaten } from "./useAffiliateDuplicaten";
import { useNegeerAffiliateDuplicaat } from "./useNegeerAffiliateDuplicaat";
import { AffiliateMergeDialog } from "./AffiliateMergeDialog";
import { AFFILIATE_REDEN_LABELS, type AffiliateLeadLite } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AffiliateDuplicatenLijstDialog({ open, onOpenChange }: Props) {
  const { data = [], isLoading } = useAffiliateDuplicaten();
  const negeer = useNegeerAffiliateDuplicaat();
  const navigate = useNavigate();
  const [mergePair, setMergePair] = useState<{ a: AffiliateLeadLite; b: AffiliateLeadLite } | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Mogelijke dubbele affiliate-leads</DialogTitle>
            <DialogDescription>
              Per paar kun je samenvoegen of aangeven dat het twee verschillende bedrijven zijn.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto -mx-6 px-6 space-y-3 flex-1">
            {isLoading && (
              <div className="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Laden…
              </div>
            )}
            {!isLoading && data.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Geen duplicaten gevonden.</p>
            )}
            {data.map((p) => {
              if (!p.lead_a || !p.lead_b) return null;
              return (
                <div key={`${p.lead_a_id}-${p.lead_b_id}`} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.match_redenen.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px]">
                        Matcht op {AFFILIATE_REDEN_LABELS[r] ?? r}
                      </Badge>
                    ))}
                    {p.score >= 2 && (
                      <Badge className="text-[10px] bg-warning/20 text-warning-foreground border-warning/40">Zeer waarschijnlijk</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LeadKaartje lead={p.lead_a} onOpen={() => { onOpenChange(false); navigate(`/affiliate/leads/${p.lead_a!.id}`); }} />
                    <LeadKaartje lead={p.lead_b} onOpen={() => { onOpenChange(false); navigate(`/affiliate/leads/${p.lead_b!.id}`); }} />
                  </div>
                  <div className="flex items-center gap-2 justify-end pt-1 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => negeer.mutate({ leadAId: p.lead_a_id, leadBId: p.lead_b_id, eigenaarId: p.eigenaar_id })}
                      disabled={negeer.isPending}
                      className="gap-1.5"
                    >
                      <X className="h-4 w-4" /> Geen duplicaat
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setMergePair({ a: p.lead_a!, b: p.lead_b! })}
                      className="gap-1.5"
                    >
                      <GitMerge className="h-4 w-4" /> Samenvoegen
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {mergePair && (
        <AffiliateMergeDialog
          open={!!mergePair}
          onOpenChange={(v) => { if (!v) setMergePair(null); }}
          leadA={mergePair.a}
          leadB={mergePair.b}
          onMerged={(keptId) => { setMergePair(null); navigate(`/affiliate/leads/${keptId}`); }}
        />
      )}
    </>
  );
}

function LeadKaartje({ lead, onOpen }: { lead: AffiliateLeadLite; onOpen: () => void }) {
  return (
    <div className="rounded-lg border bg-background p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{lead.bedrijfsnaam || lead.contactpersoon || "Onbekend"}</p>
          <p className="text-[11px] text-muted-foreground">Aangemaakt {new Date(lead.created_at).toLocaleDateString("nl-NL")}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpen} aria-label="Open lead">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground truncate">{lead.email ?? "—"}</p>
      <p className="text-xs text-muted-foreground truncate">{lead.telefoon ?? "—"}</p>
      {lead.website && <p className="text-xs text-muted-foreground truncate">{lead.website}</p>}
      {(lead.adres || lead.plaats) && (
        <p className="text-xs text-muted-foreground truncate">{[lead.adres, lead.postcode, lead.plaats].filter(Boolean).join(" ")}</p>
      )}
      {lead.status && <Badge variant="secondary" className="text-[10px] mt-1">{String(lead.status).replace(/_/g, " ")}</Badge>}
    </div>
  );
}