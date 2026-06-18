import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";

interface ImportRow {
  id: string;
  bestandsnaam: string;
  totaal_rijen: number;
  geimporteerd: number;
  afgekeurd: number;
  kolom_mapping: Record<string, string | null> | null;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function KoudeLeadsImportHistorie() {
  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-lead-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_lead_imports")
        .select("id, bestandsnaam, totaal_rijen, geimporteerd, afgekeurd, kolom_mapping, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ImportRow[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Importgeschiedenis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Geschiedenis laden…
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nog geen imports vastgelegd.</p>
        ) : (
          <div className="border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wanneer</TableHead>
                  <TableHead>Bestand</TableHead>
                  <TableHead className="text-right">Totaal</TableHead>
                  <TableHead className="text-right">Geïmporteerd</TableHead>
                  <TableHead className="text-right">Afgekeurd</TableHead>
                  <TableHead>Mapping</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const mappingEntries = row.kolom_mapping
                    ? Object.entries(row.kolom_mapping).filter(([, v]) => v)
                    : [];
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(row.created_at)}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={row.bestandsnaam}>{row.bestandsnaam}</TableCell>
                      <TableCell className="text-right">{row.totaal_rijen}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300">{row.geimporteerd}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.afgekeurd > 0 ? (
                          <Badge variant="outline" className="text-amber-800 border-amber-300">{row.afgekeurd}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md">
                        {mappingEntries.length === 0 ? "—" : mappingEntries.map(([k, v]) => `${k} ← ${v}`).join(", ")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}