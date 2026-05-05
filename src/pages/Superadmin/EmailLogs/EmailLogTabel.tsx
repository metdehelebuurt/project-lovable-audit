import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { EmailRow } from "./useEmailLogs";

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (["verzonden", "sent", "ontvangen"].includes(s))
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{status}</Badge>;
  if (["mislukt", "fout", "failed", "dlq", "bounced"].includes(s))
    return <Badge variant="destructive">{status}</Badge>;
  if (["suppressed", "complained", "skipped_no_account"].includes(s))
    return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">{status}</Badge>;
  if (s === "pending") return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

interface Props {
  rows: EmailRow[] | undefined;
  isLoading: boolean;
  onSelect: (row: EmailRow) => void;
}

export function EmailLogTabel({ rows, isLoading, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Geen e-mails gevonden voor deze filters.</p>;
  }
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Datum</TableHead>
            <TableHead className="w-[160px]">Type</TableHead>
            <TableHead>Verzonden door</TableHead>
            <TableHead>Ontvanger</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={`${r.bron}-${r.id}`} className="text-sm">
              <TableCell className="whitespace-nowrap">
                {new Date(r.datum).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
              </TableCell>
              <TableCell className="font-mono text-xs">{r.type}</TableCell>
              <TableCell className="max-w-[260px] truncate" title={r.van ?? ""}>{r.van ?? "—"}</TableCell>
              <TableCell className="max-w-[260px] truncate" title={r.naar}>{r.naar}</TableCell>
              <TableCell>{statusBadge(r.status)}</TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => onSelect(r)}>Bekijk</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}