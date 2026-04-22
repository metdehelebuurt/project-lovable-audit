import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package } from "lucide-react";
import type { Installatie } from "./api/installatieApi";

interface ProductRegel {
  omschrijving?: string;
  aantal?: number;
  prijs_per_stuk?: number;
}

export default function InstallatieProductenCard({ installatie }: { installatie: Installatie }) {
  const regels = (Array.isArray(installatie.producten) ? installatie.producten : []) as ProductRegel[];

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Producten / werkzaamheden</CardTitle>
      </CardHeader>
      <CardContent>
        {regels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen producten gekoppeld</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="text-right w-20">Aantal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regels.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.omschrijving ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.aantal ?? 1}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}