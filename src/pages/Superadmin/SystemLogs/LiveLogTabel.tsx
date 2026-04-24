import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { useSystemLogs, type SystemLogRow } from "@/hooks/useSystemErrorLogs";

function fmtTs(ts: unknown): string {
  if (typeof ts === "number") {
    const ms = ts > 1e15 ? ts / 1000 : ts;
    return new Date(ms).toLocaleString("nl-NL");
  }
  if (typeof ts === "string") return new Date(ts).toLocaleString("nl-NL");
  return "—";
}

interface Props {
  type: "edge" | "auth" | "postgres" | "function";
}

export function LiveLogTabel({ type }: Props) {
  const [zoek, setZoek] = useState("");
  const [fnNaam, setFnNaam] = useState("");
  const [uren, setUren] = useState(24);

  const { data = [], isLoading, refetch, isFetching, error } = useSystemLogs({
    type, search: zoek, function_name: fnNaam, hours: uren,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="Zoek in event_message…" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        {type === "function" && (
          <Input placeholder="Function id/naam…" value={fnNaam} onChange={(e) => setFnNaam(e.target.value)} />
        )}
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
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Verversen
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          {(error as Error).message}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Tijd</TableHead>
              <TableHead className="w-[100px]">Status/Niveau</TableHead>
              <TableHead>Bericht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Geen logs gevonden.</TableCell></TableRow>
            ) : data.map((row: SystemLogRow, idx) => (
              <TableRow key={(row.id as string) ?? idx}>
                <TableCell className="text-xs whitespace-nowrap">{fmtTs(row.timestamp)}</TableCell>
                <TableCell className="text-xs">
                  {String((row.status_code ?? row.status ?? row.level ?? row.error_severity ?? "—"))}
                </TableCell>
                <TableCell className="text-xs font-mono whitespace-pre-wrap break-words max-w-3xl">
                  {String(row.event_message ?? row.msg ?? row.error ?? JSON.stringify(row))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}