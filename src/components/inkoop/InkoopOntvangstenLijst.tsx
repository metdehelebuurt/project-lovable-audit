import { useInkoopOntvangsten } from "@/hooks/inkoop/useInkoopOntvangsten";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageCheck, AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";
import OntvangstDialog from "./OntvangstDialog";

interface Props {
  inkooporderId: string;
  partnerId: string;
  inkooporderRegels: { omschrijving: string; aantal: number }[];
  kanBoeken?: boolean;
}

export default function InkoopOntvangstenLijst({ inkooporderId, partnerId, inkooporderRegels, kanBoeken = true }: Props) {
  const { data: ontvangsten = [] } = useInkoopOntvangsten(inkooporderId);
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-primary" /> Ontvangsten
        </CardTitle>
        {kanBoeken && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ontvangst boeken
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {ontvangsten.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Nog geen ontvangsten geregistreerd
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Regels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opmerking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ontvangsten.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{new Date(o.ontvangstdatum).toLocaleDateString("nl-NL")}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(o.regels as any[]).map((r, i) => (
                        <div key={i}>
                          {r.omschrijving}: {r.ontvangen_aantal}/{r.besteld_aantal}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {o.discrepantie ? (
                      <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Discrepantie
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-success-light text-success">Compleet</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.opmerking || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <OntvangstDialog
        open={open}
        onOpenChange={setOpen}
        inkooporderId={inkooporderId}
        partnerId={partnerId}
        inkooporderRegels={inkooporderRegels}
      />
    </Card>
  );
}