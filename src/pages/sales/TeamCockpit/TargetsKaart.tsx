import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Target, Plus } from "lucide-react";
import { useTeamStats } from "@/hooks/sales/useTeamStats";
import { useTeamTargets, useSetTeamTarget } from "@/hooks/sales/useTeamTargets";
import { euro } from "@/lib/sales/forecast";

function huidigeMaand() {
  const nu = new Date();
  return { jaar: nu.getFullYear(), maand: nu.getMonth() + 1, label: nu.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) };
}

/** Omzet per rep in de huidige maand op basis van gewonnen leads. */
function useOmzetHuidigeMaand() {
  const { jaar, maand } = huidigeMaand();
  return useQuery({
    queryKey: ["team-omzet-maand", jaar, maand],
    queryFn: async (): Promise<Record<string, number>> => {
      const start = new Date(jaar, maand - 1, 1).toISOString();
      const eind = new Date(jaar, maand, 1).toISOString();
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("eigenaar_id, geschatte_waarde, updated_at")
        .eq("fase_slug", "gewonnen")
        .gte("updated_at", start)
        .lt("updated_at", eind)
        .limit(2000);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) {
        if (!r.eigenaar_id) continue;
        map[r.eigenaar_id] = (map[r.eigenaar_id] ?? 0) + Number(r.geschatte_waarde ?? 0);
      }
      return map;
    },
  });
}

export default function TargetsKaart() {
  const { stats, isLoading } = useTeamStats();
  const { jaar, maand, label } = huidigeMaand();
  const targetsQ = useTeamTargets(jaar, maand);
  const omzetQ = useOmzetHuidigeMaand();
  const setTarget = useSetTeamTarget();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gekozenRep, setGekozenRep] = useState<string>("");
  const [bedrag, setBedrag] = useState<string>("10000");

  const targetMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of targetsQ.data ?? []) if (t.affiliate_id) m[t.affiliate_id] = Number(t.target_omzet ?? 0);
    return m;
  }, [targetsQ.data]);

  const rijen = useMemo(() => {
    return (stats ?? [])
      .filter((s) => s.eigenaar_id)
      .map((s) => {
        const target = targetMap[s.eigenaar_id!] ?? 0;
        const omzet = (omzetQ.data ?? {})[s.eigenaar_id!] ?? 0;
        const pct = target > 0 ? Math.min(200, Math.round((omzet / target) * 100)) : 0;
        return { id: s.eigenaar_id!, naam: s.naam, target, omzet, pct };
      })
      .sort((a, b) => (b.target || 0) - (a.target || 0) || b.omzet - a.omzet);
  }, [stats, targetMap, omzetQ.data]);

  const totaalTarget = rijen.reduce((a, r) => a + r.target, 0);
  const totaalOmzet = rijen.reduce((a, r) => a + r.omzet, 0);
  const totaalPct = totaalTarget > 0 ? Math.min(200, Math.round((totaalOmzet / totaalTarget) * 100)) : 0;

  const opslaan = async () => {
    if (!gekozenRep || !bedrag) return;
    const n = Number(bedrag);
    if (!Number.isFinite(n) || n < 0) return;
    await setTarget.mutateAsync({ affiliate_id: gekozenRep, jaar, maand, target_omzet: n });
    setDialogOpen(false);
  };

  return (
    <Card data-testid="targets-kaart">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Targets — {label}
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1" data-testid="targets-open-dialog">
              <Plus className="h-3.5 w-3.5" /> Target zetten
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Target instellen voor deze maand</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Verkoper</Label>
                <Select value={gekozenRep} onValueChange={setGekozenRep}>
                  <SelectTrigger data-testid="targets-rep-select"><SelectValue placeholder="Kies verkoper" /></SelectTrigger>
                  <SelectContent>
                    {rijen.map((r) => <SelectItem key={r.id} value={r.id}>{r.naam}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Doel-omzet (€)</Label>
                <Input type="number" min="0" step="500" value={bedrag} onChange={(e) => setBedrag(e.target.value)} data-testid="targets-bedrag-input" />
              </div>
              <Button className="w-full" onClick={opslaan} disabled={!gekozenRep || setTarget.isPending} data-testid="targets-opslaan">
                Opslaan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border p-3 bg-primary/5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Team-totaal</span>
            <span className="font-semibold" data-testid="targets-totaal">{euro(totaalOmzet)} / {euro(totaalTarget)}</span>
          </div>
          <Progress value={Math.min(100, totaalPct)} className="mt-1.5" />
          <div className="text-[11px] text-muted-foreground mt-1">{totaalPct}% van team-target</div>
        </div>
        {isLoading || targetsQ.isLoading ? (
          <Skeleton className="h-24" />
        ) : rijen.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">Nog geen verkopers of targets ingesteld.</div>
        ) : (
          <ul className="space-y-2" data-testid="targets-rep-lijst">
            {rijen.slice(0, 8).map((r) => (
              <li key={r.id} className="text-sm" data-testid="targets-rep-rij">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{r.naam}</span>
                  <span className={r.pct >= 100 ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
                    {euro(r.omzet)} / {r.target > 0 ? euro(r.target) : "geen target"}
                  </span>
                </div>
                <Progress value={Math.min(100, r.pct)} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}