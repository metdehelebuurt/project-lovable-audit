import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import { useAffiliatesMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";
import { useAffiliateAfwezigheid, useZetAfwezigheid, useVerwijderAfwezigheid } from "@/hooks/sales/useAanwezigheid";

const DAGEN = 14;

function isoDatum(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function dagLabel(d: Date): string {
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "2-digit" });
}

export default function SalesAanwezigheid() {
  const start = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const dagen = useMemo(() => Array.from({ length: DAGEN }, (_, i) => addDays(start, i)), [start]);
  const { data: affiliates = [], isLoading: teamLaden } = useAffiliatesMetAgenda();
  const { data: rijen = [], isLoading } = useAffiliateAfwezigheid(isoDatum(start), isoDatum(addDays(start, DAGEN - 1)));
  const zet = useZetAfwezigheid();
  const verwijder = useVerwijderAfwezigheid();

  const [userId, setUserId] = useState("");
  const [van, setVan] = useState("");
  const [tot, setTot] = useState("");
  const [reden, setReden] = useState("");

  const perUser = useMemo(() => {
    const map = new Map<string, typeof rijen>();
    for (const r of rijen) {
      const lijst = map.get(r.user_id) ?? [];
      lijst.push(r);
      map.set(r.user_id, lijst);
    }
    return map;
  }, [rijen]);

  const isAfwezig = (uid: string, dag: Date) => {
    const dagIso = isoDatum(dag);
    return (perUser.get(uid) ?? []).find((r) => r.van <= dagIso && r.tot >= dagIso) ?? null;
  };

  const opslaan = () => {
    if (!userId || !van || !tot) return;
    zet.mutate(
      { user_id: userId, van, tot, reden },
      { onSuccess: () => { setVan(""); setTot(""); setReden(""); } },
    );
  };

  if (teamLaden || isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4" data-testid="aanwezigheid-agenda">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Afwezigheid vastleggen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="aanwezigheid-affiliate">Affiliate</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="aanwezigheid-affiliate"><SelectValue placeholder="Kies affiliate" /></SelectTrigger>
                <SelectContent>
                  {affiliates.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {`${a.voornaam ?? ""} ${a.achternaam ?? ""}`.trim() || a.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs" htmlFor="aanwezigheid-van">Van</Label>
              <Input id="aanwezigheid-van" type="date" value={van} onChange={(e) => setVan(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs" htmlFor="aanwezigheid-tot">Tot</Label>
              <Input id="aanwezigheid-tot" type="date" value={tot} onChange={(e) => setTot(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs" htmlFor="aanwezigheid-reden">Reden</Label>
                <Input id="aanwezigheid-reden" value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Vakantie" />
              </div>
              <Button onClick={opslaan} disabled={!userId || !van || !tot || zet.isPending} className="self-end">
                Opslaan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Aanwezigheid komende twee weken
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="text-left font-medium px-2">Affiliate</th>
                {dagen.map((d) => (
                  <th key={d.toISOString()} className="px-1 font-medium text-muted-foreground">{dagLabel(d)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id}>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {`${a.voornaam ?? ""} ${a.achternaam ?? ""}`.trim() || a.email}
                  </td>
                  {dagen.map((d) => {
                    const blok = isAfwezig(a.id, d);
                    const weekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <td key={d.toISOString()} className="px-1 py-1 text-center">
                        <span
                          title={blok ? blok.reden ?? "Afwezig" : weekend ? "Weekend" : "Aanwezig"}
                          className={`inline-block h-5 w-5 rounded ${
                            blok
                              ? "bg-destructive/70"
                              : weekend
                                ? "bg-muted"
                                : "bg-emerald-500/70"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {affiliates.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">Geen affiliates gevonden.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Geplande afwezigheid</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rijen.length === 0 ? (
            <p className="text-sm text-muted-foreground">Niemand heeft afwezigheid gepland in deze periode.</p>
          ) : rijen.map((r) => (
            <div key={r.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{r.naam || r.email}</p>
                <p className="text-muted-foreground text-xs">
                  {r.van} t/m {r.tot}{r.reden ? ` · ${r.reden}` : ""}{r.partner_naam ? ` · ${r.partner_naam}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Afwezigheid verwijderen"
                onClick={() => verwijder.mutate(r.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
