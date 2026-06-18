import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";

const AffiliateMijnKlanten = () => {
  const { user } = useAuth();
  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliate-mijn-klanten", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("*, partners:partner_id(naam, status, trial_einddatum, created_at, email)")
        .eq("affiliate_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totaalCommissie = referrals.reduce((s, r) => s + Number(r.commissie_verdiend ?? 0), 0);

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Mijn klanten</h1>
          <p className="text-sm text-muted-foreground">{referrals.length} aangebrachte partners</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Totale commissie</p>
          <p className="text-xl font-bold">€{totaalCommissie.toFixed(2)}</p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bedrijf</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trial eindigt</TableHead>
              <TableHead>Commissie %</TableHead>
              <TableHead>Verdiend</TableHead>
              <TableHead>Aangemeld</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nog geen aangebrachte klanten.</TableCell></TableRow>}
            {referrals.map((r) => {
              const p = r.partners as { naam: string | null; status: string | null; trial_einddatum: string | null } | null;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{p?.naam ?? "Onbekend"}</TableCell>
                  <TableCell><Badge variant={r.status === "actief" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>{p?.trial_einddatum ? new Date(p.trial_einddatum).toLocaleDateString("nl-NL") : "—"}</TableCell>
                  <TableCell>{r.commissie_percentage}%</TableCell>
                  <TableCell>€{Number(r.commissie_verdiend ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString("nl-NL")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AffiliateMijnKlanten;