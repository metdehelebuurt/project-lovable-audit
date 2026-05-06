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

interface AuditRow {
  id: string;
  created_at: string;
  partner_id: string | null;
  actor_id: string | null;
  target_user_id: string | null;
  actie: string;
  entity_type: string | null;
  entity_id: string | null;
  oude_waarde: Record<string, unknown> | null;
  nieuwe_waarde: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function AuditLogTabel() {
  const [zoek, setZoek] = useState("");
  const [actieFilter, setActieFilter] = useState("");
  const [uren, setUren] = useState(168);
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit-log", { zoek, actieFilter, uren }],
    queryFn: async (): Promise<AuditRow[]> => {
      const since = new Date(Date.now() - uren * 60 * 60 * 1000).toISOString();
      let q = supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (actieFilter) q = q.eq("actie", actieFilter);
      if (zoek) q = q.or(`actie.ilike.%${zoek}%,entity_type.ilike.%${zoek}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="Zoek in actie of entiteit…" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        <Select value={actieFilter || "all"} onValueChange={(v) => setActieFilter(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Actie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle acties</SelectItem>
            <SelectItem value="gebruiker_aangemaakt">Gebruiker aangemaakt</SelectItem>
            <SelectItem value="gebruiker_gewijzigd">Gebruiker gewijzigd</SelectItem>
            <SelectItem value="break_glass_verleend">Break-glass verleend</SelectItem>
            <SelectItem value="break_glass_ingetrokken">Break-glass ingetrokken</SelectItem>
            <SelectItem value="module_override_toegevoegd">Module override toegevoegd</SelectItem>
            <SelectItem value="module_override_verwijderd">Module override verwijderd</SelectItem>
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
              <TableHead className="w-[220px]">Actie</TableHead>
              <TableHead className="w-[160px]">Entiteit</TableHead>
              <TableHead className="w-[260px]">Actor / Target</TableHead>
              <TableHead>Wijziging</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen audit-records in deze periode.</TableCell></TableRow>
            ) : data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs whitespace-nowrap">{fmt(row.created_at)}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{row.actie}</Badge></TableCell>
                <TableCell className="text-xs">{row.entity_type ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono">
                  <div>actor: {row.actor_id?.slice(0, 8) ?? "—"}</div>
                  {row.target_user_id && <div className="text-muted-foreground">target: {row.target_user_id.slice(0, 8)}</div>}
                </TableCell>
                <TableCell className="text-xs max-w-md truncate">
                  {row.nieuwe_waarde ? JSON.stringify(row.nieuwe_waarde).slice(0, 120) : "—"}
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Audit detail</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tijd:</span> {fmt(detail.created_at)}</div>
                <div><span className="text-muted-foreground">Actie:</span> {detail.actie}</div>
                <div><span className="text-muted-foreground">Entiteit:</span> {detail.entity_type ?? "—"}</div>
                <div><span className="text-muted-foreground">Entiteit ID:</span> <span className="font-mono text-xs">{detail.entity_id ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Actor:</span> <span className="font-mono text-xs">{detail.actor_id ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Target user:</span> <span className="font-mono text-xs">{detail.target_user_id ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Partner:</span> <span className="font-mono text-xs">{detail.partner_id ?? "—"}</span></div>
                <div><span className="text-muted-foreground">IP:</span> {detail.ip ?? "—"}</div>
              </div>
              {detail.oude_waarde && (
                <div>
                  <div className="font-medium mb-1">Oude waarde</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">{JSON.stringify(detail.oude_waarde, null, 2)}</pre>
                </div>
              )}
              {detail.nieuwe_waarde && (
                <div>
                  <div className="font-medium mb-1">Nieuwe waarde</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">{JSON.stringify(detail.nieuwe_waarde, null, 2)}</pre>
                </div>
              )}
              {detail.user_agent && (
                <div className="text-xs text-muted-foreground"><span className="font-medium">UA:</span> {detail.user_agent}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}