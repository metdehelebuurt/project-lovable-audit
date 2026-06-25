import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ChevronLeft, ChevronRight, Plus, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAffiliatesMetAgenda, type AffiliateMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";
import {
  useSalesBusyBlocks, useSalesPlatformAfspraken, useAnnuleerSalesAfspraak,
} from "@/hooks/sales/useSalesAgenda";
import { PlanAfspraakDialog } from "./PlanAfspraakDialog";

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const day = (r.getDay() + 6) % 7; // ma = 0
  r.setDate(r.getDate() - day);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function naam(a?: AffiliateMetAgenda) {
  if (!a) return "Onbekend";
  return [a.voornaam, a.achternaam].filter(Boolean).join(" ").trim() || a.email || "Onbekend";
}

function tijdLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export default function SalesAgenda() {
  const { data: affiliates = [], isLoading: affLoading } = useAffiliatesMetAgenda();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [planOpen, setPlanOpen] = useState(false);
  const [planFor, setPlanFor] = useState<{ affiliateId?: string; datum?: Date }>({});
  const annuleer = useAnnuleerSalesAfspraak();

  const ids = useMemo(() => [...selected], [selected]);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const fromIso = weekStart.toISOString();
  const toIso = weekEnd.toISOString();

  const { data: platform = [] } = useSalesPlatformAfspraken(ids, fromIso, toIso);
  const { data: busy = {}, isLoading: busyLoading } = useSalesBusyBlocks(ids, fromIso, toIso);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allOn = affiliates.length > 0 && affiliates.every((a) => selected.has(a.id));
  const toggleAll = () => {
    setSelected(allOn ? new Set() : new Set(affiliates.map((a) => a.id)));
  };

  const dagen = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const platformByAffDay = useMemo(() => {
    const map = new Map<string, typeof platform>();
    for (const a of platform) {
      const d = new Date(a.geplande_op);
      const key = `${a.affiliate_id}|${d.toISOString().slice(0, 10)}`;
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [platform]);

  const busyByAffDay = useMemo(() => {
    const map = new Map<string, { start: string; end: string }[]>();
    for (const [affId, res] of Object.entries(busy)) {
      for (const b of res.busy) {
        const d = new Date(b.start);
        const key = `${affId}|${d.toISOString().slice(0, 10)}`;
        const arr = map.get(key) ?? [];
        arr.push(b);
        map.set(key, arr);
      }
    }
    return map;
  }, [busy]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" /> Sales-agenda
          </h1>
          <p className="text-sm text-muted-foreground">
            Overzicht en planning over alle affiliates. Externe Google-afspraken worden alleen als <em>bezet</em> getoond — geen titels of details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Deze week</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setPlanFor({}); setPlanOpen(true); }} className="gap-1">
            <Plus className="h-4 w-4" /> Afspraak plannen
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Affiliates ({selected.size}/{affiliates.length} geselecteerd)</span>
            <Button variant="ghost" size="sm" onClick={toggleAll}>{allOn ? "Geen" : "Alles"}</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen actieve affiliates gevonden.</p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="flex flex-wrap gap-2">
                {affiliates.map((a) => {
                  const on = selected.has(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggle(a.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                    >
                      <Checkbox checked={on} className="pointer-events-none h-3 w-3" />
                      <span>{naam(a)}</span>
                      {a.has_google_calendar && <Link2 className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {ids.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Kies één of meer affiliates om hun agenda te zien.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Week van {weekStart.toLocaleDateString("nl-NL", { day: "2-digit", month: "long" })} t/m {addDays(weekStart, 6).toLocaleDateString("nl-NL", { day: "2-digit", month: "long" })}
              {busyLoading && <span className="ml-2 text-xs text-muted-foreground">(Google-bezet laden…)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ids.map((affId) => {
              const a = affiliates.find((x) => x.id === affId);
              const busyRes = busy[affId];
              return (
                <div key={affId} className="rounded-lg border">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2 bg-muted/40">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{naam(a)}</span>
                      {a?.has_google_calendar
                        ? <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><Link2 className="h-3 w-3" /> Google</Badge>
                        : <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">Geen Google</Badge>}
                      {busyRes?.error && (
                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 gap-1">
                          <AlertCircle className="h-3 w-3" /> Bezet onbekend
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setPlanFor({ affiliateId: affId }); setPlanOpen(true); }}>
                      <Plus className="h-3 w-3" /> Plannen
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x">
                    {dagen.map((dag) => {
                      const dagKey = `${affId}|${dag.toISOString().slice(0, 10)}`;
                      const pAfsp = platformByAffDay.get(dagKey) ?? [];
                      const bBlocks = busyByAffDay.get(dagKey) ?? [];
                      const isToday = dag.toDateString() === new Date().toDateString();
                      return (
                        <button
                          key={dagKey}
                          onClick={() => { setPlanFor({ affiliateId: affId, datum: new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(), 10, 0) }); setPlanOpen(true); }}
                          className={`text-left p-2 min-h-[110px] hover:bg-muted/40 transition-colors ${isToday ? "bg-primary/5" : ""}`}
                        >
                          <p className="text-[10px] font-medium uppercase text-muted-foreground">
                            {dag.toLocaleDateString("nl-NL", { weekday: "short", day: "2-digit", month: "short" })}
                          </p>
                          <div className="mt-1 space-y-1">
                            {pAfsp.map((p) => (
                              <div
                                key={p.id}
                                onClick={(e) => e.stopPropagation()}
                                className={`rounded border px-2 py-1 text-[11px] ${p.afgehandeld_op ? "bg-slate-50 line-through text-muted-foreground" : "bg-violet-50 border-violet-200 text-violet-900"}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-medium">{tijdLabel(p.geplande_op)} · {p.type === "demo" ? "Demo" : "Terugbel"}</span>
                                  {!p.afgehandeld_op && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); if (confirm("Afspraak afvinken?")) annuleer.mutate(p.id); }}
                                      className="text-violet-700 hover:text-violet-900"
                                      title="Afvinken"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                                {p.notitie && <p className="truncate">{p.notitie}</p>}
                              </div>
                            ))}
                            {bBlocks.map((b, i) => (
                              <div
                                key={`${b.start}-${i}`}
                                title="Externe Google-afspraak — details niet zichtbaar"
                                className="rounded border border-dashed border-slate-300 bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                              >
                                {tijdLabel(b.start)}–{tijdLabel(b.end)} · Bezet
                              </div>
                            ))}
                            {pAfsp.length === 0 && bBlocks.length === 0 && (
                              <p className="text-[10px] text-muted-foreground">—</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <PlanAfspraakDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        affiliates={affiliates}
        defaultAffiliateId={planFor.affiliateId}
        defaultDatum={planFor.datum}
      />
    </div>
  );
}