import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, GitMerge } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FieldRow } from "@/components/leads/duplicaten/MergeDialog/FieldRow";
import type { Keuze } from "@/components/leads/duplicaten/MergeDialog/useMergeForm";
import { AFFILIATE_LEAD_FIELDS, type AffiliateLeadLite } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadA: AffiliateLeadLite;
  leadB: AffiliateLeadLite;
  onMerged?: (keptLeadId: string) => void;
}

function isLeeg(v: unknown) {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

function defaultKeuze(va: unknown, vb: unknown, fallback: Keuze): Keuze {
  if (isLeeg(va) && !isLeeg(vb)) return "b";
  if (!isLeeg(va) && isLeeg(vb)) return "a";
  return fallback;
}

export function AffiliateMergeDialog({ open, onOpenChange, leadA, leadB, onMerged }: Props) {
  const qc = useQueryClient();

  const initialKeep: Keuze =
    new Date(leadA.created_at).getTime() <= new Date(leadB.created_at).getTime() ? "a" : "b";
  const [keepSide, setKeepSide] = useState<Keuze>(initialKeep);

  const initialKeuzes = useMemo(() => {
    const out: Record<string, Keuze> = {};
    for (const f of AFFILIATE_LEAD_FIELDS) {
      out[f.key] = defaultKeuze(leadA[f.key], leadB[f.key], initialKeep);
    }
    return out;
  }, [leadA, leadB, initialKeep]);

  const [keuzes, setKeuzes] = useState<Record<string, Keuze>>(initialKeuzes);
  useEffect(() => setKeuzes(initialKeuzes), [initialKeuzes]);

  const keepLead = keepSide === "a" ? leadA : leadB;
  const mergeLead = keepSide === "a" ? leadB : leadA;

  const buildPayload = () => {
    const lead_values: Record<string, unknown> = {};
    for (const f of AFFILIATE_LEAD_FIELDS) {
      const winner = keuzes[f.key] ?? initialKeep;
      lead_values[f.key] = winner === "a" ? leadA[f.key] : leadB[f.key];
    }
    return {
      keep_lead_id: keepLead.id,
      merge_lead_id: mergeLead.id,
      lead_values,
    };
  };

  const merge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("affiliate-lead-merge", { body: buildPayload() });
      if (error) throw error;
      if ((data as { error?: unknown })?.error) throw new Error(String((data as { error?: unknown }).error));
      return data as { kept_lead_id: string };
    },
    onSuccess: (data) => {
      toast.success("Leads samengevoegd");
      qc.invalidateQueries({ queryKey: ["affiliate-lead-duplicaten"] });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      qc.invalidateQueries({ queryKey: ["affiliateLeads"] });
      onOpenChange(false);
      onMerged?.(data.kept_lead_id);
    },
    onError: (e: Error) => toast.error(`Samenvoegen mislukt: ${e.message}`),
  });

  const titel = (l: AffiliateLeadLite) => l.bedrijfsnaam || l.contactpersoon || l.email || "Onbekend";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" /> Affiliate-leads samenvoegen
          </DialogTitle>
          <DialogDescription>
            Kies per veld welke waarde behouden moet blijven. Alle contactmomenten, opvolgtaken, terugbel-afspraken,
            referrals en commissies worden overgezet naar de behouden lead. De andere lead wordt verwijderd.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[140px_1fr_1fr] gap-3 py-3 border-y bg-muted/30 px-3 rounded-lg">
          <div className="text-xs font-semibold text-muted-foreground self-center">Behoud-lead</div>
          <KeuzeKnop
            active={keepSide === "a"}
            title={titel(leadA)}
            subtitle={`Aangemaakt ${new Date(leadA.created_at).toLocaleDateString("nl-NL")}`}
            onClick={() => setKeepSide("a")}
          />
          <KeuzeKnop
            active={keepSide === "b"}
            title={titel(leadB)}
            subtitle={`Aangemaakt ${new Date(leadB.created_at).toLocaleDateString("nl-NL")}`}
            onClick={() => setKeepSide("b")}
          />
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <div className="py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Lead-gegevens</h3>
            <div className="rounded-lg border bg-card px-3">
              {AFFILIATE_LEAD_FIELDS.map((f) => (
                <FieldRow
                  key={f.key}
                  name={`aff-${f.key}`}
                  label={f.label}
                  valueA={leadA[f.key]}
                  valueB={leadB[f.key]}
                  keuze={keuzes[f.key] ?? "a"}
                  onChange={(k) => setKeuzes((p) => ({ ...p, [f.key]: k }))}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex-1 text-xs text-muted-foreground flex items-center gap-1">
            <Badge variant="outline" className="font-mono">{titel(mergeLead)}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge className="font-mono">{titel(keepLead)}</Badge>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            Annuleren
          </Button>
          <Button onClick={() => merge.mutate()} disabled={merge.isPending} className="gap-2">
            {merge.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            Definitief samenvoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeuzeKnop({ active, title, subtitle, onClick }: { active: boolean; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "text-left px-3 py-2 rounded-lg border transition-colors",
        active ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-input bg-background hover:bg-accent",
      )}
    >
      <p className="text-sm font-medium truncate">{title}</p>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </button>
  );
}