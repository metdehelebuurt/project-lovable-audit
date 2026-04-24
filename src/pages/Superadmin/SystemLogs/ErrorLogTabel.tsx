import { useState } from "react";
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
import { useSystemErrorLogs, type SystemErrorLog } from "@/hooks/useSystemErrorLogs";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function NiveauBadge({ niveau }: { niveau: string }) {
  const map: Record<string, string> = {
    fatal: "bg-destructive text-destructive-foreground",
    error: "bg-destructive/80 text-destructive-foreground",
    warning: "bg-warning/80 text-warning-foreground",
    info: "bg-muted text-foreground",
  };
  return <Badge className={map[niveau] ?? "bg-muted"}>{niveau}</Badge>;
}

export function ErrorLogTabel() {
  const [zoek, setZoek] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [edgeFunctie, setEdgeFunctie] = useState("");
  const [bron, setBron] = useState<string>("");
  const [niveau, setNiveau] = useState<string>("");
  const [uren, setUren] = useState<number>(24);
  const [detail, setDetail] = useState<SystemErrorLog | null>(null);

  const { data = [], isLoading, refetch, isFetching } = useSystemErrorLogs({
    zoek, emailFilter, edgeFunctie,
    bron: bron || undefined,
    niveau: niveau || undefined,
    uren,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input placeholder="Zoek in bericht…" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        <Input placeholder="E-mail bevat…" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} />
        <Input placeholder="Edge function bevat…" value={edgeFunctie} onChange={(e) => setEdgeFunctie(e.target.value)} />
        <Select value={bron} onValueChange={(v) => setBron(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Bron" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle bronnen</SelectItem>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="edge_function">Edge function</SelectItem>
            <SelectItem value="client_unhandled">Client (window error)</SelectItem>
            <SelectItem value="client_promise">Client (promise)</SelectItem>
            <SelectItem value="database">Database</SelectItem>
          </SelectContent>
        </Select>
        <Select value={niveau} onValueChange={(v) => setNiveau(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle niveaus</SelectItem>
            <SelectItem value="fatal">Fatal</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={String(uren)} onValueChange={(v) => setUren(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 uur</SelectItem>
              <SelectItem value="6">6 uur</SelectItem>
              <SelectItem value="24">24 uur</SelectItem>
              <SelectItem value="72">3 dagen</SelectItem>
              <SelectItem value="168">7 dagen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Tijd</TableHead>
              <TableHead className="w-[90px]">Niveau</TableHead>
              <TableHead className="w-[130px]">Bron</TableHead>
              <TableHead className="w-[200px]">Gebruiker</TableHead>
              <TableHead className="w-[180px]">Edge function</TableHead>
              <TableHead>Bericht</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Geen errors gevonden in deze periode.</TableCell></TableRow>
            ) : data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs whitespace-nowrap">{fmt(row.created_at)}</TableCell>
                <TableCell><NiveauBadge niveau={row.niveau} /></TableCell>
                <TableCell className="text-xs">{row.bron}</TableCell>
                <TableCell className="text-xs">
                  {row.user_email ?? <span className="text-muted-foreground">—</span>}
                  {row.user_rol && <div className="text-muted-foreground">{row.user_rol}</div>}
                </TableCell>
                <TableCell className="text-xs font-mono">{row.edge_function_naam ?? "—"}</TableCell>
                <TableCell className="text-xs max-w-md truncate" title={row.bericht}>{row.bericht}</TableCell>
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
          <DialogHeader>
            <DialogTitle>Error detail</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tijd:</span> {fmt(detail.created_at)}</div>
                <div><span className="text-muted-foreground">Niveau:</span> <NiveauBadge niveau={detail.niveau} /></div>
                <div><span className="text-muted-foreground">Bron:</span> {detail.bron}</div>
                <div><span className="text-muted-foreground">Status:</span> {detail.status_code ?? "—"}</div>
                <div><span className="text-muted-foreground">User:</span> {detail.user_email ?? "—"}</div>
                <div><span className="text-muted-foreground">Rol:</span> {detail.user_rol ?? "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Edge function:</span> {detail.edge_function_naam ?? "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Route:</span> {detail.route ?? "—"}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Bericht</div>
                <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap break-words">{detail.bericht}</pre>
              </div>
              {detail.stacktrace && (
                <div>
                  <div className="font-medium mb-1">Stacktrace</div>
                  <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap break-words max-h-80 overflow-auto">{detail.stacktrace}</pre>
                </div>
              )}
              {detail.context && Object.keys(detail.context).length > 0 && (
                <div>
                  <div className="font-medium mb-1">Context</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">{JSON.stringify(detail.context, null, 2)}</pre>
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