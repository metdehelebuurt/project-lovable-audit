import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadHistorieRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_naam: string | null;
  actor_rol: string | null;
  actie: string;
  veld: string | null;
  oude_waarde: string | null;
  nieuwe_waarde: string | null;
}

export function useLeadHistorie(leadId: string | undefined) {
  return useQuery({
    enabled: !!leadId,
    queryKey: ["lead-historie", leadId],
    queryFn: async (): Promise<LeadHistorieRow[]> => {
      const { data, error } = await supabase
        .from("entiteit_historie")
        .select("id,created_at,actor_id,actor_naam,actor_rol,actie,veld,oude_waarde,nieuwe_waarde")
        .eq("entiteit_type", "affiliate_lead")
        .eq("entiteit_id", leadId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as LeadHistorieRow[];
    },
  });
}