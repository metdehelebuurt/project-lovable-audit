import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, RefreshCw } from "lucide-react";
import { useTeamStats } from "@/hooks/sales/useTeamStats";
import { useLatestCoachingTips, useGenerateCoachingTips } from "@/hooks/sales/useCoachingTips";

const KLEUR: Record<string, string> = {
  hoog: "bg-rose-50 text-rose-700 border-rose-200",
  midden: "bg-amber-50 text-amber-700 border-amber-200",
  laag: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function CoachingKaart() {
  const { stats } = useTeamStats();
  const reps = (stats ?? []).filter((s) => s.eigenaar_id);
  const [repId, setRepId] = useState<string>("");
  useEffect(() => { if (!repId && reps[0]?.eigenaar_id) setRepId(reps[0].eigenaar_id); }, [reps, repId]);

  const tipsQ = useLatestCoachingTips(repId || null);
  const gen = useGenerateCoachingTips();

  const draai = async (force = false) => {
    if (!repId) return;
    await gen.mutateAsync({ rep_id: repId, force });
  };

  return (
    <Card data-testid="coaching-kaart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> AI coaching-tips
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Select value={repId} onValueChange={setRepId}>
            <SelectTrigger className="h-8 text-xs" data-testid="coaching-rep-select">
              <SelectValue placeholder="Kies verkoper" />
            </SelectTrigger>
            <SelectContent>
              {reps.map((r) => <SelectItem key={r.eigenaar_id!} value={r.eigenaar_id!}>{r.naam}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => draai(true)} disabled={!repId || gen.isPending} className="gap-1" data-testid="coaching-vernieuwen">
            <RefreshCw className={`h-3.5 w-3.5 ${gen.isPending ? "animate-spin" : ""}`} /> Vernieuwen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tipsQ.isLoading ? (
          <Skeleton className="h-24" />
        ) : !tipsQ.data || tipsQ.data.tips.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            Nog geen tips voor deze verkoper.
            <Button size="sm" variant="link" onClick={() => draai(false)} disabled={!repId || gen.isPending} className="px-1" data-testid="coaching-genereer">
              Genereer nu
            </Button>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="coaching-tips-lijst">
            {tipsQ.data.tips.map((t, i) => (
              <li key={i} className="rounded-md border p-2" data-testid="coaching-tip">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{t.titel}</span>
                  <Badge variant="outline" className={KLEUR[t.prioriteit] ?? ""}>{t.prioriteit}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.toelichting}</p>
              </li>
            ))}
          </ul>
        )}
        {tipsQ.data?.gegenereerd_op && (
          <p className="text-[10px] text-muted-foreground">
            Bijgewerkt {new Date(tipsQ.data.gegenereerd_op).toLocaleDateString("nl-NL")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}