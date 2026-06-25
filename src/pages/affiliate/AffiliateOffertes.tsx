import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_KLEUR: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  geaccepteerd: "default",
  verzonden: "secondary",
  concept: "outline",
  afgewezen: "destructive",
};

function formatBedrag(n: number | null | undefined) {
  return `€${Number(n ?? 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const AffiliateOffertes = () => {
  const { user } = useAuth();
  const { data: offertes = [], isLoading } = useQuery({
    queryKey: ["affiliate-offertes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offertes")
        .select("id, offertenummer, klant_naam, klant_email, totaal_bedrag, status, created_at, accepted_at")
        .eq("adviseur_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totaal = offertes.reduce((s, o) => s + Number(o.totaal_bedrag ?? 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Mijn offertes</h1>
          <p className="text-sm text-muted-foreground">
            Offertes die jij hebt opgemaakt voor je eigen klanten. {offertes.length} totaal · waarde {formatBedrag(totaal)}
          </p>
        </div>
        <Button asChild>
          <Link to="/offertes/nieuw"><Plus className="h-4 w-4 mr-1" /> Nieuwe offerte</Link>
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Totaal</TableHead>
              <TableHead>Aangemaakt</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
            )}
            {!isLoading && offertes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Je hebt nog geen offertes opgemaakt voor klanten.
                </TableCell>
              </TableRow>
            )}
            {offertes.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.offertenummer ?? "—"}</TableCell>
                <TableCell className="font-medium">{o.klant_naam ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{o.klant_email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_KLEUR[o.status ?? ""] ?? "secondary"}>{o.status ?? "—"}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatBedrag(o.totaal_bedrag)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("nl-NL") : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/offertes/${o.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AffiliateOffertes;