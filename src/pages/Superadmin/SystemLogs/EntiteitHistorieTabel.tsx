import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Eye, RefreshCw } from "lucide-react";

interface HistorieRow {
  id: string;
  created_at: string;
  partner_id: string | null;
  entiteit_type: string;
  entiteit_id: string;
  actor_id: string | null;
  actor_naam: string | null;
  actor_rol: string | null;
  actie: string;
  veld: string | null;
  oude_waarde: string | null;
  nieuwe_waarde: string | null;
  details: Record<string, unknown> | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const ENTITEITEN = ["lead", "klant", "offerte", "schouw", "taak", "inkooporder"];

export function EntiteitHistorieTabel() {
  const [zoek, setZoek] = useState("");
  const [entiteit, setEntiteit] = useState("");
  const [uren, setUren] = useState(72);
  const [detail, setDetail] = useState<HistorieRow | null>(null);

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["entiteit-historie", { zoek, entiteit, uren }],
    queryFn: async (): Promise<HistorieRow[]> => {
      const since = new Date(Date.now() - uren * 60 * 60 * 1000).toISOString();
      let q = supabase
        .from("entiteit_historie")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (entiteit) q = q.eq("entiteit_type", entiteit);
      if (zoek) q = q.or(`actie.ilike.%${zoek}%,actor_naam.ilike.%${zoek}%,veld.ilike.%${zoek}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as HistorieRow[];
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="Zoek in actie / actor / veld…" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        <Select value={entiteit || "all"} onValueChange={(v) => setEntiteit(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Entiteit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle entiteiten</SelectItem>
            {ENTITEITEN.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(uren)} onValueChange={(v) => setUren(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24">24 uur</SelectItem>
            <SelectItem value="72">3 dagen</SelectItem>
            <SelectItem value="168">7 dagen</SelectItem>
            <SelectItem value="720">30 dagen</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Tijd</TableHead>
              <TableHead className="w-[110px]">Entiteit</TableHead>
              <TableHead className="w-[180px]">Actie</TableHead>
              <TableHead className="w-[180px]">Actor</TableHead>
              <TableHead>Wijziging</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen wijzigingen in deze periode.</TableCell></TableRow>
            ) : data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs whitespace-nowrap">{fmt(row.created_at)}</TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{row.entiteit_type}</Badge></TableCell>
                <TableCell className="text-xs">{row.actie}{row.veld ? ` · ${row.veld}` : ""}</TableCell>
                <TableCell className="text-xs">
                  {row.actor_naam ?? "—"}
                  {row.actor_rol && <div className="text-muted-foreground">{row.actor_rol}</div>}
                </TableCell>
                <TableCell className="text-xs max-w-md truncate">
                  {row.oude_waarde || row.nieuwe_waarde
                    ? `${row.oude_waarde ?? "∅"} → ${row.nieuwe_waarde ?? "∅"}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDetail(row)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Wijziging detail</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tijd:</span> {fmt(detail.created_at)}</div>
                <div><span className="text-muted-foreground">Actie:</span> {detail.actie}</div>
                <div><span className="text-muted-foreground">Entiteit:</span> {detail.entiteit_type}</div>
                <div><span className="text-muted-foreground">Entiteit ID:</span> <span className="font-mono text-xs">{detail.entiteit_id}</span></div>
                <div><span className="text-muted-foreground">Actor:</span> {detail.actor_naam ?? "—"}</div>
                <div><span className="text-muted-foreground">Rol:</span> {detail.actor_rol ?? "—"}</div>
                <div><span className="text-muted-foreground">Veld:</span> {detail.veld ?? "—"}</div>
              </div>
              {(detail.oude_waarde || detail.nieuwe_waarde) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-medium mb-1 text-xs">Oude waarde</div>
                    <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap break-words">{detail.oude_waarde ?? "∅"}</pre>
                  </div>
                  <div>
                    <div className="font-medium mb-1 text-xs">Nieuwe waarde</div>
                    <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap break-words">{detail.nieuwe_waarde ?? "∅"}</pre>
                  </div>
                </div>
              )}
              {detail.details && (
                <div>
                  <div className="font-medium mb-1">Details</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">{JSON.stringify(detail.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}