import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRetouren } from "@/hooks/retouren/useRetouren";
import RetourStatusBadge from "./RetourStatusBadge";

interface Props {
  partnerId: string | undefined;
  klantId?: string;
  opdrachtId?: string;
  installatieId?: string;
  leverancierId?: string;
  emptyText?: string;
}

export default function RetourenLijst(props: Props) {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useRetouren(props);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RMA</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reden</TableHead>
              <TableHead>Relatie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{props.emptyText ?? "Geen retouren"}</TableCell></TableRow>
            ) : (
              items.map((r: any) => {
                const relatie = r.type === "klant_retour"
                  ? (r.klanten?.bedrijfsnaam || `${r.klanten?.voornaam ?? ""} ${r.klanten?.achternaam ?? ""}`.trim() || r.opdrachten?.klant_naam || "—")
                  : (r.leveranciers?.naam || "—");
                return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-accent/40" onClick={() => navigate(`/retouren/${r.id}`)}>
                    <TableCell className="font-medium">{r.rma_nummer}</TableCell>
                    <TableCell>{r.type === "klant_retour" ? "Klantretour" : "Leveranciersretour"}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.reden}</TableCell>
                    <TableCell>{relatie}</TableCell>
                    <TableCell><RetourStatusBadge status={r.status} /></TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}