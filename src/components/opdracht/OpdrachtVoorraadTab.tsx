import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, AlertTriangle, CheckCircle2, Loader2, Barcode } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  matchProductOpRegel,
  reserveerVoorOpdracht,
  vrijgevenVoorOpdracht,
} from "@/lib/voorraad";
import SNToewijzingDialog from "./SNToewijzingDialog";

interface OfferteRegel {
  omschrijving: string;
  aantal: number;
  product_id?: string | null;
}

interface Props {
  opdrachtId: string;
  partnerId: string;
  opdrachtStatus: string;
  regels: OfferteRegel[];
}

interface RegelView {
  regelIndex: number;
  omschrijving: string;
  aantal: number;
  productId: string | null;
  vrijVoorraad: number;
  alGereserveerd: number;
  tekort: number;
}

const OpdrachtVoorraadTab = ({ opdrachtId, partnerId, opdrachtStatus, regels }: Props) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [snDialogOpen, setSnDialogOpen] = useState(false);

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-voor-voorraad", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producten")
        .select("id, naam, merk, model, voorraad")
        .eq("partner_id", partnerId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: mutaties = [] } = useQuery({
    queryKey: ["mutaties-voor-producten", producten.map((p) => p.id).join(",")],
    enabled: producten.length > 0,
    queryFn: async () => {
      const ids = producten.map((p) => p.id);
      const { data } = await supabase
        .from("voorraad_mutaties" as any)
        .select("product_id, type, aantal")
        .in("product_id", ids);
      return (data || []) as any[];
    },
  });

  const { data: alleReserveringen = [] } = useQuery({
    queryKey: ["reserveringen-voor-producten", producten.map((p) => p.id).join(",")],
    enabled: producten.length > 0,
    queryFn: async () => {
      const ids = producten.map((p) => p.id);
      const { data } = await supabase
        .from("voorraad_reserveringen" as any)
        .select("product_id, opdracht_id, aantal, status")
        .in("product_id", ids)
        .eq("status", "actief");
      return (data || []) as any[];
    },
  });

  const rows: RegelView[] = useMemo(() => {
    return regels.map((r, i) => {
      const direct = r.product_id ? producten.find((p) => p.id === r.product_id) : undefined;
      const prod = direct ?? matchProductOpRegel(r.omschrijving, producten);
      let totaal = 0;
      let gereserveerdAndere = 0;
      let alVoorDezeOrder = 0;
      if (prod) {
        mutaties
          .filter((m) => m.product_id === prod.id)
          .forEach((m) => {
            const a = Number(m.aantal);
            if (m.type === "inkomend" || m.type === "vrijgave" || m.type === "correctie") totaal += a;
            if (m.type === "uitgaand" || m.type === "reservering") totaal -= a;
          });
        alleReserveringen
          .filter((res) => res.product_id === prod.id)
          .forEach((res) => {
            if (res.opdracht_id === opdrachtId) alVoorDezeOrder += Number(res.aantal);
            else gereserveerdAndere += Number(res.aantal);
          });
      }
      const vrij = totaal - gereserveerdAndere - alVoorDezeOrder;
      const tekort = Math.max(0, r.aantal - alVoorDezeOrder - vrij);
      return {
        regelIndex: i,
        omschrijving: r.omschrijving,
        aantal: r.aantal,
        productId: prod?.id ?? null,
        vrijVoorraad: vrij,
        alGereserveerd: alVoorDezeOrder,
        tekort,
      };
    });
  }, [regels, producten, mutaties, alleReserveringen, opdrachtId]);

  const reserveer = useMutation({
    mutationFn: async () => {
      for (const row of rows) {
        if (!row.productId) continue;
        if (row.alGereserveerd >= row.aantal) continue;
        const teReserveren = row.aantal - row.alGereserveerd;
        await reserveerVoorOpdracht({
          partner_id: partnerId,
          product_id: row.productId,
          opdracht_id: opdrachtId,
          regel_id: `regel-${row.regelIndex}`,
          aantal: teReserveren,
          actor_id: profile?.id,
        });
      }
    },
    onSuccess: () => {
      toast.success("Voorraad gereserveerd");
      qc.invalidateQueries({ queryKey: ["mutaties-voor-producten"] });
      qc.invalidateQueries({ queryKey: ["reserveringen-voor-producten"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const vrijgeven = useMutation({
    mutationFn: async () => {
      await vrijgevenVoorOpdracht(partnerId, opdrachtId, profile?.id);
    },
    onSuccess: () => {
      toast.success("Reserveringen vrijgegeven");
      qc.invalidateQueries({ queryKey: ["mutaties-voor-producten"] });
      qc.invalidateQueries({ queryKey: ["reserveringen-voor-producten"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tekorten = rows.filter((r) => r.tekort > 0 && r.productId);
  const ongekoppeld = rows.filter((r) => !r.productId);
  const heeftReserveringen = rows.some((r) => r.alGereserveerd > 0);
  const isFinaal = ["afgerond", "geannuleerd"].includes(opdrachtStatus);

  const startInkooporder = () => {
    const params = new URLSearchParams({ opdracht: opdrachtId });
    navigate(`/financieel/nieuw/inkooporder?${params.toString()}`);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Voorraad & Inkoop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ongekoppeld.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {ongekoppeld.length} regel(s) konden niet automatisch aan een product worden gekoppeld. Controleer de productcatalogus.
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regel</TableHead>
              <TableHead className="text-right">Nodig</TableHead>
              <TableHead className="text-right">Vrij</TableHead>
              <TableHead className="text-right">Gereserveerd</TableHead>
              <TableHead className="text-right">Tekort</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.regelIndex}>
                <TableCell>
                  <div className="font-medium">{r.omschrijving}</div>
                  {!r.productId && (
                    <div className="text-xs text-muted-foreground">Geen product gekoppeld</div>
                  )}
                </TableCell>
                <TableCell className="text-right">{r.aantal}</TableCell>
                <TableCell className="text-right">{r.productId ? r.vrijVoorraad : "—"}</TableCell>
                <TableCell className="text-right text-warning-foreground">{r.alGereserveerd}</TableCell>
                <TableCell className={`text-right font-medium ${r.tekort > 0 ? "text-error" : ""}`}>
                  {r.productId ? r.tekort : "—"}
                </TableCell>
                <TableCell>
                  {!r.productId ? (
                    <Badge variant="outline">N.v.t.</Badge>
                  ) : r.alGereserveerd >= r.aantal ? (
                    <Badge className="bg-success-light text-success gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Volledig
                    </Badge>
                  ) : r.tekort > 0 ? (
                    <Badge className="bg-error-light text-error gap-1">
                      <AlertTriangle className="h-3 w-3" /> Tekort
                    </Badge>
                  ) : (
                    <Badge variant="outline">Beschikbaar</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!isFinaal && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => reserveer.mutate()} disabled={reserveer.isPending}>
              {reserveer.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Bezig...</>
              ) : (
                "Voorraad reserveren"
              )}
            </Button>
            {tekorten.length > 0 && (
              <Button variant="outline" onClick={startInkooporder} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Inkooporder voor tekorten ({tekorten.length})
              </Button>
            )}
            {heeftReserveringen && (
              <Button
                variant="ghost"
                onClick={() => vrijgeven.mutate()}
                disabled={vrijgeven.isPending}
                className="ml-auto"
              >
                Reserveringen vrijgeven
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setSnDialogOpen(true)}
              className="gap-2"
            >
              <Barcode className="h-4 w-4" />
              Serienummers toewijzen
            </Button>
          </div>
        )}
      </CardContent>
      <SNToewijzingDialog
        open={snDialogOpen}
        onOpenChange={setSnDialogOpen}
        opdrachtId={opdrachtId}
        partnerId={partnerId}
        regels={regels}
      />
    </Card>
  );
};

export default OpdrachtVoorraadTab;
