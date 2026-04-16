import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/types/offerte";

interface Props {
  docs: any[];
}

export function DebiteurenCrediteuren({ docs }: Props) {
  const navigate = useNavigate();

  const debiteuren = docs.filter(
    (d) => d.type === "verkoopfactuur" && ["verzonden", "verlopen"].includes(d.status)
  );
  const crediteuren = docs.filter(
    (d) => d.type === "inkoopfactuur" && ["ontvangen", "goedgekeurd"].includes(d.status)
  );

  const totaalDebiteuren = debiteuren.reduce((s, d) => s + d.totaal_bedrag, 0);
  const totaalCrediteuren = crediteuren.reduce((s, d) => s + d.totaal_bedrag, 0);

  const isVerlopen = (doc: any) => {
    if (!doc.vervaldatum) return false;
    return new Date(doc.vervaldatum) < new Date();
  };

  const renderTable = (items: any[], type: "debiteur" | "crediteur") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nummer</TableHead>
          <TableHead>Relatie</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Vervaldatum</TableHead>
          <TableHead className="text-right">Bedrag</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
              Geen openstaande {type === "debiteur" ? "debiteuren" : "crediteuren"}
            </TableCell>
          </TableRow>
        ) : (
          items.map((doc) => {
            const relatie = doc.klanten
              ? doc.klanten.bedrijfsnaam || `${doc.klanten.voornaam} ${doc.klanten.achternaam}`
              : doc.leveranciers?.naam || "—";
            const verlopen = isVerlopen(doc);
            return (
              <TableRow
                key={doc.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/financieel/${doc.id}`)}
              >
                <TableCell className="font-mono text-sm">{doc.documentnummer}</TableCell>
                <TableCell>{relatie}</TableCell>
                <TableCell>{new Date(doc.factuurdatum).toLocaleDateString("nl-NL")}</TableCell>
                <TableCell>
                  <span className={verlopen ? "text-destructive font-medium" : ""}>
                    {doc.vervaldatum ? new Date(doc.vervaldatum).toLocaleDateString("nl-NL") : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(doc.totaal_bedrag)}</TableCell>
                <TableCell>
                  <Badge variant={verlopen ? "destructive" : "secondary"}>
                    {verlopen ? "Verlopen" : doc.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <Tabs defaultValue="debiteuren">
      <TabsList>
        <TabsTrigger value="debiteuren">
          Debiteuren ({debiteuren.length}) — {formatCurrency(totaalDebiteuren)}
        </TabsTrigger>
        <TabsTrigger value="crediteuren">
          Crediteuren ({crediteuren.length}) — {formatCurrency(totaalCrediteuren)}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="debiteuren">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Openstaande debiteuren</CardTitle>
          </CardHeader>
          <CardContent>{renderTable(debiteuren, "debiteur")}</CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="crediteuren">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Openstaande crediteuren</CardTitle>
          </CardHeader>
          <CardContent>{renderTable(crediteuren, "crediteur")}</CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
