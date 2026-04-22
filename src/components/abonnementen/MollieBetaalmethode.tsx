import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  partnerId: string;
  redirectAfter?: string;
}

interface PartnerMollie {
  mollie_customer_id: string | null;
  mollie_mandate_id: string | null;
  mollie_mandate_status: string | null;
}

export default function MollieBetaalmethode({ partnerId, redirectAfter }: Props) {
  const [partner, setPartner] = useState<PartnerMollie | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("partners")
      .select("mollie_customer_id, mollie_mandate_id, mollie_mandate_status")
      .eq("id", partnerId)
      .maybeSingle();
    setPartner(data as PartnerMollie | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [partnerId]);

  const startCheckout = async () => {
    setBusy(true);
    try {
      if (!partner?.mollie_customer_id) {
        const { error: cErr } = await supabase.functions.invoke("mollie-create-customer");
        if (cErr) throw cErr;
      }
      const { data, error } = await supabase.functions.invoke("mollie-create-mandate-checkout", {
        body: { redirectUrl: redirectAfter ?? `${window.location.origin}/abonnementen?mandate=ok` },
      });
      if (error) throw error;
      const checkoutUrl = (data as { checkoutUrl?: string })?.checkoutUrl;
      if (!checkoutUrl) throw new Error("Geen checkout URL ontvangen");
      window.location.href = checkoutUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      toast.error(`Kon betaalmethode niet starten: ${msg}`);
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  const isValid = partner?.mollie_mandate_status === "valid";

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Betaalmethode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isValid ? (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 text-green-800">
            <CheckCircle2 className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Betaalmethode actief</p>
              <p className="text-xs">Toekomstige facturen worden automatisch geïncasseerd.</p>
              <Badge variant="secondary" className="mt-2">Mandaat: {partner?.mollie_mandate_id}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 text-orange-800">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Geen betaalmethode</p>
              <p className="text-xs">
                Voeg een betaalmethode toe (iDEAL, SEPA, creditcard) zodat we uw abonnement na de proefperiode kunnen verlengen.
              </p>
            </div>
          </div>
        )}
        <Button onClick={startCheckout} disabled={busy} className="w-full">
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isValid ? "Betaalmethode wijzigen" : "Betaalmethode toevoegen via Mollie"}
        </Button>
        <p className="text-xs text-muted-foreground">
          U wordt doorgestuurd naar de beveiligde Mollie-omgeving. Wij rekenen €1,00 af om uw betaalmethode te verifiëren — dit bedrag wordt direct teruggestort.
        </p>
      </CardContent>
    </Card>
  );
}