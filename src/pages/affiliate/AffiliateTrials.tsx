import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useIsLostReviewAdmin } from "@/hooks/affiliate/useIsLostReviewAdmin";
import SalesTrials from "@/pages/sales/Trials";

interface ReferralRow {
  id: string;
  commissie_percentage: number | null;
  created_at: string;
  partners: {
    id: string;
    naam: string | null;
    email: string | null;
    telefoon: string | null;
    trial_einddatum: string | null;
    status: string | null;
    created_at: string;
  } | null;
}



const AffiliateTrials = () => {
  const { user } = useAuth();
  const isSalesManager = useIsLostReviewAdmin(); // superadmin | sales_manager | bas@mijnhuis.nu

  if (isSalesManager) {
    // Zelfde weergave als /sales/trials zodat iedereen met sales-toegang exact
    // dezelfde lijst, filters en KPI-tellers ziet.
    return (
      <div className="p-6 space-y-4">
        <AffiliateSubnav />
        <SalesTrials />
      </div>
    );
  }

  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliate-trials", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("id, commissie_percentage, created_at, partners:partner_id(id, naam, email, telefoon, trial_einddatum, status, created_at)")
        .eq("affiliate_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as ReferralRow[];
    },
  });

  const today = new Date();
  const trialsHulp = referrals.filter((r) => {
    const p = r.partners;
    if (!p?.trial_einddatum) return false;
    const eind = new Date(p.trial_einddatum);
    const dagenTot = Math.floor((eind.getTime() - today.getTime()) / 86400000);
    return dagenTot >= 0 && dagenTot <= 14;
  });

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Trials die opvolging nodig hebben</h1>
        <p className="text-sm text-muted-foreground">Partners die je hebt aangebracht en wiens trial binnen 14 dagen afloopt. {trialsHulp.length} stuks.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {trialsHulp.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Geen trials die op korte termijn opvolging nodig hebben.
          </CardContent></Card>
        )}
        {trialsHulp.map((r) => {
          const p = r.partners!;
          const eind = new Date(p.trial_einddatum!);
          const dagen = Math.max(0, Math.floor((eind.getTime() - today.getTime()) / 86400000));
          return (
            <Card key={r.id}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.naam}</h3>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <Badge variant={dagen <= 3 ? "destructive" : "secondary"}>
                    {dagen === 0 ? "Verloopt vandaag" : `Nog ${dagen} dagen`}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {p.telefoon && <Button asChild size="sm" variant="outline"><a href={`tel:${p.telefoon}`}><Phone className="h-4 w-4 mr-1" />Bellen</a></Button>}
                  {p.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${p.email}?subject=Hulp%20met%20je%20mijnhuis.nu%20trial`}><Mail className="h-4 w-4 mr-1" />Mail</a></Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AffiliateTrials;

