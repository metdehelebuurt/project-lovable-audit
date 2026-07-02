import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type KlantstatusStatus =
  | "geen_match"
  | "geen_toegang"
  | "geen_abonnement"
  | "trial"
  | "betalend"
  | "opgezegd"
  | "verlopen";

export interface KlantstatusAddon {
  slug: string;
  naam: string;
  maand_prijs?: number | null;
  beschrijving?: string | null;
}

export interface KlantstatusPlan {
  slug: string;
  naam: string;
  maand_prijs?: number | null;
}

export interface Klantstatus {
  status: KlantstatusStatus;
  match_reden?: "gewonnen_lead" | "domein" | "bedrijfsnaam" | null;
  partner_id?: string | null;
  partner_naam?: string | null;
  partner_plaats?: string | null;
  plan_naam?: string | null;
  plan_slug?: string | null;
  maand_bedrag?: number | null;
  trial_einddatum?: string | null;
  opzeg_datum?: string | null;
  huidige_addons?: KlantstatusAddon[];
  upsell_addons?: KlantstatusAddon[];
  upsell_plannen?: KlantstatusPlan[];
}

export function useLeadKlantstatus(leadId: string | undefined) {
  return useQuery({
    queryKey: ["affiliate-lead-klantstatus", leadId],
    enabled: !!leadId,
    staleTime: 60_000,
    queryFn: async (): Promise<Klantstatus> => {
      const { data, error } = await supabase.rpc("affiliate_lead_klantstatus", {
        _lead_id: leadId!,
      });
      if (error) throw error;
      return (data ?? { status: "geen_match" }) as unknown as Klantstatus;
    },
  });
}