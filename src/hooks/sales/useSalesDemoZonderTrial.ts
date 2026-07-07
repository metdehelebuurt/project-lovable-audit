import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SalesLead } from "./useSalesLeads";

/**
 * Leads waar een demo geweest is (of gepland staat) maar er is nog geen trial
 * gestart. Sales manager kan deze proactief opvolgen om alsnog om te zetten.
 */
export function useSalesDemoZonderTrial() {
  return useQuery({
    queryKey: ["sales-demo-zonder-trial"],
    staleTime: 60_000,
    queryFn: async (): Promise<SalesLead[]> => {
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("*")
        .in("status", ["demo_gepland", "nieuw_demo_voltooid", "in_gesprek", "voorstel_verstuurd"])
        .is("gewonnen_partner_id", null)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as SalesLead[];
    },
  });
}