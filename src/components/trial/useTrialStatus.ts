import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const TRIAL_DUUR_DAGEN = 14;

export interface TrialStatus {
  isTrial: boolean;
  partnerNaam: string | null;
  einddatum: Date | null;
  dagenResterend: number;
  isVerlopen: boolean;
  loading: boolean;
}

const MS_PER_DAG = 24 * 60 * 60 * 1000;

/** Trialstatus van de partner van de ingelogde gebruiker. */
export function useTrialStatus(): TrialStatus {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["trial-status", profile?.partner_id],
    enabled: !!profile?.partner_id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: partner, error } = await supabase
        .from("partners")
        .select("naam, trial_einddatum, trial_aangemaakt_op")
        .eq("id", profile!.partner_id!)
        .maybeSingle();
      if (error) throw error;
      return partner;
    },
  });

  if (!data?.trial_einddatum) {
    return { isTrial: false, partnerNaam: data?.naam ?? null, einddatum: null, dagenResterend: 0, isVerlopen: false, loading: isLoading };
  }

  const einddatum = new Date(`${data.trial_einddatum}T23:59:59`);
  const isVerlopen = einddatum.getTime() < Date.now();
  const dagenResterend = isVerlopen ? 0 : Math.ceil((einddatum.getTime() - Date.now()) / MS_PER_DAG);
  return {
    isTrial: true,
    partnerNaam: data.naam,
    einddatum,
    dagenResterend,
    isVerlopen,
    loading: isLoading,
  };
}
