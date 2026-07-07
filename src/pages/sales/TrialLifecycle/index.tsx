import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarClock, Rocket, CalendarPlus, CheckCheck, XCircle, X } from "lucide-react";
import { useSalesTrials, type SalesTrialPartner } from "@/hooks/sales/useSalesTrials";
import { useTrialBulkActie } from "@/hooks/sales/useTrialBulkActie";

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
  const [selectie, setSelectie] = useState<Set<string>>(new Set());
  const bulk = useTrialBulkActie();

  const toggle = (id: string) => {
    setSelectie((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const clearSelectie = () => setSelectie(new Set());
  const doeActie = async (actie: "verleng" | "opgevolgd" | "markeer_verloren", extra: Record<string, unknown> = {}) => {
    if (selectie.size === 0) return;
    await bulk.mutateAsync({ actie, partner_ids: Array.from(selectie), ...extra });
    clearSelectie();
  };

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
      {selectie.size > 0 && (
        <div
          className="sticky top-2 z-10 rounded-lg border bg-background/95 backdrop-blur px-3 py-2 shadow-sm flex flex-wrap items-center gap-2"
          data-testid="bulk-actie-bar"
        >
          <Badge variant="secondary" data-testid="bulk-selectie-aantal">{selectie.size} geselecteerd</Badge>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => doeActie("verleng", { dagen: 14 })} disabled={bulk.isPending} data-testid="bulk-verleng-14">
            <CalendarPlus className="h-3.5 w-3.5" /> Verleng 14d
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => doeActie("verleng", { dagen: 30 })} disabled={bulk.isPending}>
            <CalendarPlus className="h-3.5 w-3.5" /> Verleng 30d
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => doeActie("opgevolgd", { notitie: "opgevolgd via trial-board" })} disabled={bulk.isPending} data-testid="bulk-opgevolgd">
            <CheckCheck className="h-3.5 w-3.5" /> Markeer opgevolgd
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-rose-600" onClick={() => doeActie("markeer_verloren")} disabled={bulk.isPending} data-testid="bulk-verloren">
            <XCircle className="h-3.5 w-3.5" /> Markeer verloren
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto gap-1" onClick={clearSelectie}>
            <X className="h-3.5 w-3.5" /> Selectie wissen
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {BUCKETS.map((b) => (
          <BucketKolom
            key={b.key}
            bucket={b}
            trials={buckets[b.key]}
            selectie={selectie}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}

function BucketKolom({
  bucket,
  trials,
  selectie,
  onToggle,
}: {
  bucket: Bucket;
  trials: SalesTrialPartner[];
  selectie: Set<string>;
  onToggle: (id: string) => void;
}) {
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
              const geselecteerd = selectie.has(t.id);
              return (
                <li
                  key={t.id}
                  className={`rounded-md border px-2 py-1.5 text-sm ${geselecteerd ? "border-primary bg-primary/5" : ""}`}
                  data-testid="trial-item"
                  data-partner-id={t.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                      <Checkbox
                        checked={geselecteerd}
                        onCheckedChange={() => onToggle(t.id)}
                        aria-label={`Selecteer ${t.naam}`}
                        data-testid="trial-item-check"
                      />
                      <span className="font-medium truncate">{t.naam}</span>
                    </label>
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