import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KlantstatusStatus } from "./useLeadKlantstatus";

export interface BulkKlantstatus {
  lead_id: string;
  status: KlantstatusStatus;
  partner_id: string | null;
  partner_naam: string | null;
}

/**
 * Batch-check voor alle zichtbare pipeline-leads.
 * Retour: map van leadId → status.
 */
export function useAffiliateKlantstatusBulk(leadIds: string[]) {
  const key = [...leadIds].sort().join(",");
  return useQuery({
    queryKey: ["affiliate-klantstatus-bulk", key],
    enabled: leadIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, BulkKlantstatus>> => {
      const { data, error } = await supabase.rpc(
        "affiliate_lead_klantstatus_bulk",
        { _lead_ids: leadIds },
      );
      if (error) throw error;
      const map: Record<string, BulkKlantstatus> = {};
      for (const row of (data ?? []) as unknown as BulkKlantstatus[]) {
        map[row.lead_id] = row;
      }
      return map;
    },
  });
}