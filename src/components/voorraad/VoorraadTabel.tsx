import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { VoorraadProductRow } from "@/hooks/voorraad/useVoorraad";

interface Props {
  rows: VoorraadProductRow[];
}

const VoorraadTabel = ({ rows }: Props) => {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground p-4">Geen producten gevonden.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead className="text-right">Vrij</TableHead>
          <TableHead className="text-right">Gereserveerd</TableHead>
          <TableHead className="text-right">Totaal</TableHead>
          <TableHead className="text-right">Min.</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const laag = r.min_voorraad > 0 && r.vrij <= r.min_voorraad;
          return (
            <TableRow key={r.id}>
              <TableCell>
                <Link to={`/producten/${r.id}`} className="font-medium hover:underline">
                  {r.naam}
                </Link>
                {(r.merk || r.model) && (
                  <div className="text-xs text-muted-foreground">
                    {[r.merk, r.model].filter(Boolean).join(" • ")}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-xs capitalize">{r.categorie}</TableCell>
              <TableCell className={`text-right font-medium ${laag ? "text-error" : ""}`}>{r.vrij}</TableCell>
              <TableCell className="text-right text-warning-foreground">{r.gereserveerd}</TableCell>
              <TableCell className="text-right">{r.voorraad}</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">{r.min_voorraad}</TableCell>
              <TableCell>
                {laag ? (
                  <Badge className="bg-error-light text-error gap-1"><AlertTriangle className="h-3 w-3" /> Lage voorraad</Badge>
                ) : (
                  <Badge variant="outline">OK</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default VoorraadTabel;
