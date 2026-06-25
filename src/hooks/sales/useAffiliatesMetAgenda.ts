import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AffiliateMetAgenda {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
  partner_id: string | null;
  has_google_calendar: boolean;
}

export function useAffiliatesMetAgenda() {
  return useQuery({
    queryKey: ["sales-agenda", "affiliates"],
    queryFn: async (): Promise<AffiliateMetAgenda[]> => {
      const { data, error } = await supabase.rpc("lijst_affiliates_voor_sales_admin");
      if (error) throw error;
      return (data ?? []) as AffiliateMetAgenda[];
    },
    staleTime: 60_000,
  });
}