import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, RefreshCw, ListChecks, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useCreateOpvolgTaak } from "@/hooks/affiliate/useOpvolgTaken";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Voorstel {
  titel: string; notitie: string; type: string; offset_dagen: number; prioriteit: string; due_op: string;
}

export function AiOpvolgKaart({ lead }: { lead: AffiliateLead }) {
  const qc = useQueryClient();
  const [scoreBezig, setScoreBezig] = useState(false);
  const [planBezig, setPlanBezig] = useState(false);
  const [voorstellen, setVoorstellen] = useState<Voorstel[]>([]);
  const [open, setOpen] = useState(false);
  const [gekozen, setGekozen] = useState<Set<number>>(new Set());
  const create = useCreateOpvolgTaak();

  const herbereken = async () => {
    setScoreBezig(true);
    try {
      const { error } = await supabase.functions.invoke("ai-affiliate-lead-score", { body: { leadId: lead.id } });
      if (error) throw error;
      toast.success("AI-score bijgewerkt");
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
    } catch (e: any) {
      toast.error("Score mislukt: " + (e?.message ?? "onbekend"));
    } finally { setScoreBezig(false); }
  };

  const genereerPlan = async () => {
    setPlanBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-affiliate-opvolg-plan", { body: { leadId: lead.id } });
      if (error) throw error;
      setVoorstellen(data?.taken ?? []);
      setGekozen(new Set((data?.taken ?? []).map((_: any, i: number) => i)));
      setOpen(true);
    } catch (e: any) {
      toast.error("Plan mislukt: " + (e?.message ?? "onbekend"));
    } finally { setPlanBezig(false); }
  };

  const opslaan = async () => {
    for (let i = 0; i < voorstellen.length; i++) {
      if (!gekozen.has(i)) continue;
      const v = voorstellen[i];
      await create.mutateAsync({
        lead_id: lead.id, titel: v.titel, notitie: v.notitie,
        type: v.type as any, prioriteit: v.prioriteit as any, due_op: v.due_op, bron: "ai",
      });
    }
    setOpen(false);
    setVoorstellen([]);
  };

  const score = lead.ai_score ?? null;
  const scoreKleur = score == null ? "bg-muted" : score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-rose-500";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> AI-opvolging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Kans op deal</span>
              <Badge variant="secondary">{score ?? "—"}/100</Badge>
            </div>
            <Progress value={score ?? 0} className="h-2" indicatorClassName={scoreKleur} />
          </div>
          {lead.ai_score_reden && <p className="text-sm text-muted-foreground italic">"{lead.ai_score_reden}"</p>}
          {lead.ai_volgende_actie && (
            <div className="border rounded-md p-2 bg-muted/40 text-sm">
              <p className="font-medium">Voorgestelde volgende actie</p>
              <p>{lead.ai_volgende_actie}</p>
              {lead.ai_volgende_actie_op && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {new Date(lead.ai_volgende_actie_op).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={herbereken} disabled={scoreBezig}>
              {scoreBezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {score == null ? "Score deze lead" : "Herbereken score"}
            </Button>
            <Button size="sm" onClick={genereerPlan} disabled={planBezig}>
              {planBezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ListChecks className="h-4 w-4 mr-2" />}
              Maak opvolgplan
            </Button>
          </div>
          {lead.laatst_gescoord_op && (
            <p className="text-xs text-muted-foreground">Laatst gescoord: {new Date(lead.laatst_gescoord_op).toLocaleString("nl-NL")}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>AI-voorstel voor opvolging</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {voorstellen.length === 0 && <p className="text-sm text-muted-foreground">Geen voorstellen ontvangen.</p>}
            {voorstellen.map((v, i) => (
              <label key={i} className="flex items-start gap-3 border rounded-md p-3 cursor-pointer hover:bg-muted/30">
                <Checkbox
                  checked={gekozen.has(i)}
                  onCheckedChange={(c) => {
                    const n = new Set(gekozen);
                    if (c) n.add(i); else n.delete(i);
                    setGekozen(n);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{v.titel}</span>
                    <Badge variant="outline" className="text-xs">{v.type}</Badge>
                  </div>
                  {v.notitie && <p className="text-xs text-muted-foreground mt-1">{v.notitie}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Inplannen op {new Date(v.due_op).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} · prioriteit {v.prioriteit}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={opslaan} disabled={gekozen.size === 0 || create.isPending}>
              {gekozen.size} taak{gekozen.size === 1 ? "" : "en"} toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}