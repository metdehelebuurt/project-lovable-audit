import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/types/offerte";

interface Props {
  docs: any[];
}

export function BTWOverzicht({ docs }: Props) {
  const currentYear = new Date().getFullYear();
  const [jaar, setJaar] = useState(String(currentYear));
  const [kwartaal, setKwartaal] = useState("alle");

  const yearDocs = docs.filter((d) => {
    const date = new Date(d.factuurdatum);
    if (date.getFullYear() !== Number(jaar)) return false;
    if (kwartaal !== "alle") {
      const q = Math.ceil((date.getMonth() + 1) / 3);
      if (q !== Number(kwartaal)) return false;
    }
    return true;
  });

  const verkoopBetaald = yearDocs.filter((d) => d.type === "verkoopfactuur" && d.status === "betaald");
  const inkoopBetaald = yearDocs.filter((d) => d.type === "inkoopfactuur" && d.status === "betaald");

  // Group by BTW percentage
  const btwGroepen = [21, 9, 0];
  const verkoopPerBTW = btwGroepen.map((pct) => {
    const bedrag = verkoopBetaald.reduce((sum, doc) => {
      const regels = (doc.regels || []) as any[];
      return sum + regels
        .filter((r: any) => r.btw_percentage === pct)
        .reduce((s: number, r: any) => s + r.aantal * r.prijs_per_stuk * (r.btw_percentage / 100), 0);
    }, 0);
    return { pct, bedrag };
  });

  const inkoopPerBTW = btwGroepen.map((pct) => {
    const bedrag = inkoopBetaald.reduce((sum, doc) => {
      const regels = (doc.regels || []) as any[];
      return sum + regels
        .filter((r: any) => r.btw_percentage === pct)
        .reduce((s: number, r: any) => s + r.aantal * r.prijs_per_stuk * (r.btw_percentage / 100), 0);
    }, 0);
    return { pct, bedrag };
  });

  const totaalVerkoopBTW = verkoopPerBTW.reduce((s, g) => s + g.bedrag, 0);
  const totaalInkoopBTW = inkoopPerBTW.reduce((s, g) => s + g.bedrag, 0);
  const totaalAfdracht = totaalVerkoopBTW - totaalInkoopBTW;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>BTW Overzicht</CardTitle>
          <div className="flex gap-2">
            <Select value={jaar} onValueChange={setJaar}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kwartaal} onValueChange={setKwartaal}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Heel jaar</SelectItem>
                <SelectItem value="1">Q1</SelectItem>
                <SelectItem value="2">Q2</SelectItem>
                <SelectItem value="3">Q3</SelectItem>
                <SelectItem value="4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>BTW Tarief</TableHead>
              <TableHead className="text-right">Verkoop BTW</TableHead>
              <TableHead className="text-right">Inkoop BTW (aftrek)</TableHead>
              <TableHead className="text-right">Afdracht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {btwGroepen.map((pct, i) => (
              <TableRow key={pct}>
                <TableCell>{pct}%</TableCell>
                <TableCell className="text-right">{formatCurrency(verkoopPerBTW[i].bedrag)}</TableCell>
                <TableCell className="text-right">{formatCurrency(inkoopPerBTW[i].bedrag)}</TableCell>
                <TableCell className="text-right">{formatCurrency(verkoopPerBTW[i].bedrag - inkoopPerBTW[i].bedrag)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell>Totaal</TableCell>
              <TableCell className="text-right">{formatCurrency(totaalVerkoopBTW)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totaalInkoopBTW)}</TableCell>
              <TableCell className="text-right">
                <Badge variant={totaalAfdracht >= 0 ? "default" : "secondary"}>
                  {formatCurrency(totaalAfdracht)}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
