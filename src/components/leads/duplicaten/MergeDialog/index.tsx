import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, GitMerge } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EIGENSCHAPPEN_FIELDS, LEAD_FIELDS, type LeadEigenschappen, type LeadLite } from "../types";
import { FieldRow } from "./FieldRow";
import { useMergeForm } from "./useMergeForm";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadA: LeadLite;
  leadB: LeadLite;
  onMerged?: (keptLeadId: string) => void;
}

export function MergeDialog({ open, onOpenChange, leadA, leadB, onMerged }: Props) {
  const qc = useQueryClient();

  const { data: eigenschappen, isLoading: eigLoading } = useQuery({
    queryKey: ["lead-merge-eigenschappen", leadA.id, leadB.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_eigenschappen")
        .select("*")
        .in("lead_id", [leadA.id, leadB.id]);
      if (error) throw error;
      const rows = (data ?? []) as unknown as LeadEigenschappen[];
      return {
        eigA: rows.find((r) => r.lead_id === leadA.id) ?? null,
        eigB: rows.find((r) => r.lead_id === leadB.id) ?? null,
      };
    },
  });

  const form = useMergeForm({
    leadA, leadB,
    eigA: eigenschappen?.eigA ?? null,
    eigB: eigenschappen?.eigB ?? null,
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      const payload = form.buildPayload();
      const { data, error } = await supabase.functions.invoke("lead-merge", { body: payload });
      if (error) throw error;
      if ((data as { error?: unknown })?.error) throw new Error(String((data as { error?: unknown }).error));
      return data as { kept_lead_id: string };
    },
    onSuccess: (data) => {
      toast.success("Leads samengevoegd");
      qc.invalidateQueries({ queryKey: ["lead-duplicaten"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
      onMerged?.(data.kept_lead_id);
    },
    onError: (e: Error) => toast.error(`Samenvoegen mislukt: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" /> Leads samenvoegen
          </DialogTitle>
          <DialogDescription>
            Kies per veld welke waarde behouden moet blijven. Alle afspraken, offertes, schouwen,
            berichten en notities worden overgezet naar de behouden lead. De andere lead wordt verwijderd.
          </DialogDescription>
        </DialogHeader>

        {/* Keuze welke lead behouden blijft */}
        <div className="grid grid-cols-[140px_1fr_1fr] gap-3 py-3 border-y bg-muted/30 px-3 rounded-lg">
          <div className="text-xs font-semibold text-muted-foreground self-center">Behoud-lead</div>
          <KeuzeKnop
            active={form.keepSide === "a"}
            title={`${leadA.voornaam} ${leadA.achternaam}`}
            subtitle={`Aangemaakt ${new Date(leadA.created_at).toLocaleDateString("nl-NL")}`}
            onClick={() => form.setKeepSide("a")}
          />
          <KeuzeKnop
            active={form.keepSide === "b"}
            title={`${leadB.voornaam} ${leadB.achternaam}`}
            subtitle={`Aangemaakt ${new Date(leadB.created_at).toLocaleDateString("nl-NL")}`}
            onClick={() => form.setKeepSide("b")}
          />
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <Sectie titel="Lead-gegevens">
            {LEAD_FIELDS.map((f) => (
              <FieldRow
                key={f.key}
                name={`lead-${f.key}`}
                label={f.label}
                valueA={leadA[f.key]}
                valueB={leadB[f.key]}
                keuze={form.leadKeuzes[f.key] ?? "a"}
                onChange={(k) => form.setLeadKeuzes((p) => ({ ...p, [f.key]: k }))}
              />
            ))}
          </Sectie>

          <Sectie titel="Lead-eigenschappen">
            {eigLoading ? (
              <div className="py-6 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Eigenschappen laden…
              </div>
            ) : !eigenschappen?.eigA && !eigenschappen?.eigB ? (
              <p className="py-3 text-sm text-muted-foreground">Geen aanvullende eigenschappen vastgelegd.</p>
            ) : (
              EIGENSCHAPPEN_FIELDS.map((f) => (
                <FieldRow
                  key={f.key}
                  name={`eig-${f.key}`}
                  label={f.label}
                  valueA={eigenschappen?.eigA?.[f.key] ?? null}
                  valueB={eigenschappen?.eigB?.[f.key] ?? null}
                  keuze={form.eigKeuzes[f.key] ?? "a"}
                  onChange={(k) => form.setEigKeuzes((p) => ({ ...p, [f.key]: k }))}
                />
              ))
            )}
          </Sectie>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex-1 text-xs text-muted-foreground flex items-center gap-1">
            <Badge variant="outline" className="font-mono">{form.mergeLead.voornaam} {form.mergeLead.achternaam}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge className="font-mono">{form.keepLead.voornaam} {form.keepLead.achternaam}</Badge>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mergeMutation.isPending}>
            Annuleren
          </Button>
          <Button onClick={() => mergeMutation.mutate()} disabled={mergeMutation.isPending} className="gap-2">
            {mergeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            Definitief samenvoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{titel}</h3>
      <div className="rounded-lg border bg-card px-3">{children}</div>
    </div>
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
      <p className="text-sm font-medium">{title}</p>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </button>
  );
}