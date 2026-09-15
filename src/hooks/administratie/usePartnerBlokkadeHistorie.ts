import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlokkadeRegel {
  id: string;
  actie: string;
  reden: string;
  created_at: string;
  uitgevoerd_door_id: string | null;
}

/** Blokkadegeschiedenis van één klantorganisatie. */
export function usePartnerBlokkadeHistorie(partnerId: string | null) {
  return useQuery({
    queryKey: ["partner-blokkades", partnerId],
    enabled: !!partnerId,
    queryFn: async (): Promise<BlokkadeRegel[]> => {
      const { data, error } = await supabase
        .from("partner_blokkades")
        .select("id, actie, reden, created_at, uitgevoerd_door_id")
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
