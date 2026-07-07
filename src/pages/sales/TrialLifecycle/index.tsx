import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Rocket } from "lucide-react";
import { useSalesTrials, type SalesTrialPartner } from "@/hooks/sales/useSalesTrials";

interface Bucket {
  key: string;
  titel: string;
  omschrijving: string;
  minDag: number;
  maxDag: number;
  suggestie: string;
}

const BUCKETS: Bucket[] = [
  { key: "d1", titel: "Dag 1–6", omschrijving: "Warm welkom & onboarding", minDag: 0, maxDag: 6, suggestie: "Bel voor kennismaking + eerste-inrichting check-in" },
  { key: "d7", titel: "Dag 7–20", omschrijving: "Activatie & waarde tonen", minDag: 7, maxDag: 20, suggestie: "Demo modules, deel snippets, meet gebruikssignalen" },
  { key: "d21", titel: "Dag 21–27", omschrijving: "Beslismomentum", minDag: 21, maxDag: 27, suggestie: "Stuur upsell-argumenten, plan closing-gesprek" },
  { key: "d28", titel: "Dag 28+", omschrijving: "Conversie of verlengen", minDag: 28, maxDag: 9999, suggestie: "Direct bellen, aanbieding sturen, contract" },
];

function trialDag(partner: SalesTrialPartner): number {
  const start = new Date(partner.created_at).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 86400000));
}

export default function TrialLifecycle() {
  const { data, isLoading } = useSalesTrials();

  const buckets = useMemo(() => {
    const map: Record<string, SalesTrialPartner[]> = { d1: [], d7: [], d21: [], d28: [] };
    for (const t of data ?? []) {
      const d = trialDag(t);
      const b = BUCKETS.find((b) => d >= b.minDag && d <= b.maxDag);
      if (b) map[b.key].push(t);
    }
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="trial-lifecycle">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Rocket className="h-4 w-4" /> Volg elke trial door de kritieke conversiemomenten.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {BUCKETS.map((b) => (
          <BucketKolom key={b.key} bucket={b} trials={buckets[b.key]} />
        ))}
      </div>
    </div>
  );
}

function BucketKolom({ bucket, trials }: { bucket: Bucket; trials: SalesTrialPartner[] }) {
  return (
    <Card data-testid={`bucket-${bucket.key}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{bucket.titel}</span>
          <Badge variant="outline">{trials.length}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{bucket.omschrijving}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="rounded-md bg-primary/5 border border-primary/20 px-2 py-1.5 text-xs">
          <span className="font-medium">Suggestie:</span> {bucket.suggestie}
        </div>
        {trials.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">Geen trials in deze fase.</div>
        ) : (
          <ul className="space-y-1.5 max-h-96 overflow-auto">
            {trials.slice(0, 30).map((t) => {
              const d = trialDag(t);
              const eindDagen = t.trial_einddatum
                ? Math.ceil((new Date(t.trial_einddatum).getTime() - Date.now()) / 86400000)
                : null;
              const eindKleur = eindDagen === null ? "" : eindDagen < 0 ? "text-rose-600" : eindDagen < 7 ? "text-amber-600" : "text-muted-foreground";
              return (
                <li key={t.id} className="rounded-md border px-2 py-1.5 text-sm" data-testid="trial-item">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{t.naam}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">Dag {d}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.affiliate ? `${t.affiliate.voornaam ?? ""} ${t.affiliate.achternaam ?? ""}`.trim() || "—" : "geen rep"}
                  </div>
                  {eindDagen !== null && (
                    <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${eindKleur}`}>
                      <CalendarClock className="h-3 w-3" />
                      {eindDagen < 0 ? `${Math.abs(eindDagen)}d verlopen` : `nog ${eindDagen}d`}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}