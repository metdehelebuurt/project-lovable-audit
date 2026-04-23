import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Link2Off } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installatieId: string;
  partnerId: string;
  leadId?: string | null;
  klantId?: string | null;
  huidigeSchouwId?: string | null;
}

interface SchouwRij {
  id: string;
  schouw_nummer: string | null;
  status: string;
  geplande_datum: string | null;
  categorie: string | null;
  consument_naam: string | null;
  adviseur_id: string | null;
}

const SchouwKoppelDialog = ({ open, onOpenChange, installatieId, partnerId, leadId, klantId, huidigeSchouwId }: Props) => {
  const qc = useQueryClient();
  const [zoek, setZoek] = useState("");
  const [toonAlle, setToonAlle] = useState(false);
  const [rijen, setRijen] = useState<SchouwRij[]>([]);
  const [bezig, setBezig] = useState(false);
  const [opslaanId, setOpslaanId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBezig(true);
    (async () => {
      let query = supabase
        .from("schouwen")
        .select("id, schouw_nummer, status, geplande_datum, categorie, consument_naam, adviseur_id, lead_id")
        .eq("partner_id", partnerId)
        .order("geplande_datum", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (!toonAlle && leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) toast.error(error.message);
      else setRijen((data ?? []) as SchouwRij[]);
      setBezig(false);
    })();
    return () => { cancelled = true; };
  }, [open, partnerId, leadId, klantId, toonAlle]);

  const gefilterd = rijen.filter((r) => {
    if (!zoek.trim()) return true;
    const q = zoek.toLowerCase();
    return (r.schouw_nummer ?? "").toLowerCase().includes(q) || (r.consument_naam ?? "").toLowerCase().includes(q);
  });

  const koppel = async (schouwId: string | null) => {
    setOpslaanId(schouwId ?? "leeg");
    const { error } = await supabase
      .from("installaties")
      .update({ schouw_id: schouwId })
      .eq("id", installatieId);
    setOpslaanId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(schouwId ? "Schouw gekoppeld" : "Schouw ontkoppeld");
    await qc.invalidateQueries({ queryKey: ["installatie"] });
    await qc.invalidateQueries({ queryKey: ["installatie-schouw"] });
    await qc.invalidateQueries({ queryKey: ["installatie-gereedheid"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Schouw koppelen aan installatie</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek op nummer of klant"
                className="pl-8"
                aria-label="Zoek schouw"
              />
            </div>
            {leadId && (
              <div className="flex items-center gap-2">
                <Switch id="toon-alle" checked={toonAlle} onCheckedChange={setToonAlle} />
                <Label htmlFor="toon-alle" className="text-xs">Toon alle</Label>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
            {bezig && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Schouwen laden…</div>}
            {!bezig && gefilterd.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {leadId && !toonAlle ? "Geen schouw gevonden voor deze lead. Zet 'Toon alle' aan." : "Geen schouwen gevonden."}
              </p>
            )}
            {gefilterd.map((r) => {
              const huidig = r.id === huidigeSchouwId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => !huidig && koppel(r.id)}
                  disabled={huidig || opslaanId !== null}
                  className={`w-full text-left rounded-lg border p-3 transition ${huidig ? "border-primary bg-primary/5" : "hover:bg-accent hover:border-accent-foreground/20"} disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.schouw_nummer ?? "Geen nummer"}</span>
                        {huidig && <Badge variant="secondary">Gekoppeld</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{r.consument_naam ?? "—"}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-0.5 shrink-0">
                      <Badge variant="outline" className="capitalize">{r.status}</Badge>
                      <div>{r.geplande_datum ?? "geen datum"}</div>
                      {r.categorie && <div className="capitalize">{r.categorie}</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {huidigeSchouwId && (
            <Button
              variant="outline"
              onClick={() => koppel(null)}
              disabled={opslaanId !== null}
              className="gap-1.5"
            >
              <Link2Off className="h-4 w-4" /> Ontkoppelen
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SchouwKoppelDialog;