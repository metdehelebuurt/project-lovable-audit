import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadOngelezen {
  nieuwe_notities: number;
  nieuwe_contactmomenten: number;
  nieuwe_mails: number;
  laatst_bekeken_op: string | null;
}

/**
 * Telt hoeveel notities, contactmomenten en inkomende mails erbij zijn gekomen
 * sinds de affiliate deze leadkaart voor het laatst opende. Wordt gebruikt om
 * bij het openen van een klant/lead een melding te tonen.
 */
export function useLeadOngelezen(leadId: string) {
  return useQuery({
    queryKey: ["affiliate-lead-ongelezen", leadId],
    enabled: !!leadId,
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<LeadOngelezen> => {
      const { data, error } = await supabase.rpc("affiliate_lead_ongelezen", { _lead_id: leadId });
      if (error) throw error;
      const rij = Array.isArray(data) ? data[0] : data;
      return {
        nieuwe_notities: rij?.nieuwe_notities ?? 0,
        nieuwe_contactmomenten: rij?.nieuwe_contactmomenten ?? 0,
        nieuwe_mails: rij?.nieuwe_mails ?? 0,
        laatst_bekeken_op: rij?.laatst_bekeken_op ?? null,
      };
    },
  });
}