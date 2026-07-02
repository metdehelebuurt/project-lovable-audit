import { useInkoopOntvangsten } from "@/hooks/inkoop/useInkoopOntvangsten";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageCheck, AlertTriangle, Plus, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  inkooporderId: string;
  partnerId: string;
  inkooporderRegels: { product_id?: string | null; omschrijving: string; aantal: number }[];
  kanBoeken?: boolean;
}

export default function InkoopOntvangstenLijst({ inkooporderId, partnerId, inkooporderRegels, kanBoeken = true }: Props) {
  const { data: ontvangsten = [] } = useInkoopOntvangsten(inkooporderId);
  const navigate = useNavigate();

  const openPakbon = async (pad: string) => {
    const { data } = await supabase.storage.from("inkoop-documenten").createSignedUrl(pad, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-primary" /> Ontvangsten
        </CardTitle>
        {kanBoeken && (
          <Button size="sm" onClick={() => navigate(`/inkoop/${inkooporderId}/ontvangst`)}>
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
                <TableHead>Pakbon / vervoerder</TableHead>
                <TableHead>Regels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opmerking</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ontvangsten.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{new Date(o.ontvangstdatum).toLocaleDateString("nl-NL")}</TableCell>
                  <TableCell className="text-xs">
                    {(o as any).pakbon_nummer && <div>#{(o as any).pakbon_nummer}</div>}
                    {(o as any).vervoerder && <div className="text-muted-foreground">{(o as any).vervoerder}</div>}
                    {!(o as any).pakbon_nummer && !(o as any).vervoerder && <span className="text-muted-foreground">—</span>}
                  </TableCell>
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
                  <TableCell className="text-right">
                    {(o as any).ontvangst_document_url && (
                      <Button size="sm" variant="ghost" onClick={() => openPakbon((o as any).ontvangst_document_url)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}