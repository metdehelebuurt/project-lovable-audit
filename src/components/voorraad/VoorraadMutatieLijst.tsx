import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProductMutaties } from "@/hooks/voorraad/useVoorraad";

interface Props {
  productId: string;
}

const labels: Record<string, string> = {
  inkomend: "Inkomend",
  uitgaand: "Uitgaand",
  reservering: "Reservering",
  vrijgave: "Vrijgave",
  correctie: "Correctie",
};

const colors: Record<string, string> = {
  inkomend: "bg-success-light text-success",
  uitgaand: "bg-error-light text-error",
  reservering: "bg-warning-light text-warning-foreground",
  vrijgave: "bg-accent text-accent-foreground",
  correctie: "bg-muted text-muted-foreground",
};

const VoorraadMutatieLijst = ({ productId }: Props) => {
  const { data, isLoading } = useProductMutaties(productId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Laden...</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">Nog geen mutaties geregistreerd.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Datum</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Aantal</TableHead>
          <TableHead>Referentie</TableHead>
          <TableHead>Reden</TableHead>
          <TableHead>Door</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((m) => {
          const isAf = m.type === "uitgaand" || m.type === "reservering";
          return (
            <TableRow key={m.id}>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(m.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
              </TableCell>
              <TableCell>
                <Badge className={colors[m.type] ?? ""}>{labels[m.type] ?? m.type}</Badge>
              </TableCell>
              <TableCell className={`text-right font-medium ${isAf ? "text-error" : "text-success"}`}>
                {isAf ? "−" : "+"}{Number(m.aantal)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {m.referentie_type ?? "—"}
              </TableCell>
              <TableCell className="text-xs">{m.reden ?? "—"}</TableCell>
              <TableCell className="text-xs">{m.actor_naam ?? "—"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default VoorraadMutatieLijst;
