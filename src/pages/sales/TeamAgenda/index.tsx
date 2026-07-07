import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, User, PhoneCall, Video } from "lucide-react";
import { useAffiliatesMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";
import { useSalesPlatformAfspraken } from "@/hooks/sales/useSalesAgenda";

function startOfWeek(d = new Date()): Date {
  const day = (d.getDay() + 6) % 7; // maandag = 0
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - day);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function dagLabel(d: Date): string {
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "2-digit", month: "short" });
}

function tijd(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function iconVoor(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("demo") || t.includes("meet")) return <Video className="h-3 w-3" />;
  return <PhoneCall className="h-3 w-3" />;
}

export default function TeamAgenda() {
  const { data: team, isLoading: teamLoading } = useAffiliatesMetAgenda();
  const van = useMemo(() => startOfWeek(), []);
  const tot = useMemo(() => addDays(van, 7), [van]);
  const affiliateIds = useMemo(() => (team ?? []).map((t) => t.id), [team]);
  const { data: afspraken, isLoading } = useSalesPlatformAfspraken(
    affiliateIds,
    van.toISOString(),
    tot.toISOString(),
  );

  const naamPerId = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of team ?? []) m[t.id] = `${t.voornaam ?? ""} ${t.achternaam ?? ""}`.trim() || (t.email ?? "?");
    return m;
  }, [team]);

  const perDag = useMemo(() => {
    const map: Record<string, typeof afspraken> = {};
    for (let i = 0; i < 7; i++) {
      map[addDays(van, i).toDateString()] = [];
    }
    for (const a of afspraken ?? []) {
      const key = new Date(a.geplande_op).toDateString();
      if (map[key]) map[key].push(a);
    }
    for (const k of Object.keys(map)) {
      map[k]?.sort((a, b) => a.geplande_op.localeCompare(b.geplande_op));
    }
    return map;
  }, [afspraken, van]);

  if (teamLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="team-agenda">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" /> Alle sales-afspraken van deze week op één overzicht.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => {
          const dag = addDays(van, i);
          const items = perDag[dag.toDateString()] ?? [];
          const vandaag = dag.toDateString() === new Date().toDateString();
          return (
            <Card key={i} className={vandaag ? "border-primary" : ""} data-testid={`agenda-dag-${i}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{dagLabel(dag)}</span>
                  <Badge variant="outline">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {items.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">Vrij.</div>
                ) : items.map((a) => (
                  <div key={a.id} className="rounded-md border px-2 py-1.5 text-xs" data-testid="agenda-item">
                    <div className="flex items-center gap-1 font-medium">
                      {iconVoor(a.type)}
                      <Clock className="h-3 w-3" />{tijd(a.geplande_op)}
                      {a.type && <span className="text-muted-foreground">· {a.type}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <User className="h-3 w-3" />
                      <span className="truncate">{naamPerId[a.affiliate_id] ?? "?"}</span>
                    </div>
                    {a.notitie && <div className="mt-0.5 text-muted-foreground line-clamp-2">{a.notitie}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}