import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BlokkadeStatus {
  isGeblokkeerd: boolean;
  reden: string | null;
  geblokkeerdOp: string | null;
  openstaandBedrag: number;
}

/** Blokkadestatus van de eigen organisatie; superadmins worden nooit geblokkeerd. */
export function usePartnerBlokkadeStatus() {
  const { profile, loading } = useAuth();
  const partnerId = profile?.partner_id ?? null;
  const vrijgesteld = !profile || profile.rol === "superadmin" || !partnerId;

  const query = useQuery({
    queryKey: ["partner-blokkadestatus", partnerId],
    enabled: !vrijgesteld,
    queryFn: async (): Promise<BlokkadeStatus> => {
      const [partnerRes, factuurRes] = await Promise.all([
        supabase
          .from("partners")
          .select("status, geblokkeerd_op, geblokkeerd_reden")
          .eq("id", partnerId!)
          .maybeSingle(),
        supabase
          .from("facturen")
          .select("totaal_bedrag")
          .eq("partner_id", partnerId!)
          .in("status", ["verstuurd", "vervallen"]),
      ]);
      if (partnerRes.error) throw partnerRes.error;
      const openstaandBedrag = (factuurRes.data ?? []).reduce(
        (som, f) => som + Number(f.totaal_bedrag ?? 0),
        0,
      );
      return {
        isGeblokkeerd: partnerRes.data?.status === "geblokkeerd",
        reden: partnerRes.data?.geblokkeerd_reden ?? null,
        geblokkeerdOp: partnerRes.data?.geblokkeerd_op ?? null,
        openstaandBedrag,
      };
    },
  });

  return {
    status: query.data ?? null,
    isGeblokkeerd: !vrijgesteld && query.data?.isGeblokkeerd === true,
    isLoading: loading || (!vrijgesteld && query.isLoading),
  };
}
