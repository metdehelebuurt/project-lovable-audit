import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Houdt de affiliate-leads queries live via Supabase Realtime.
 * Reageert op INSERT/UPDATE/DELETE op affiliate_leads en invalideert de query-cache.
 */
export function useRealtimeAffiliateLeads() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("affiliate-leads-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "affiliate_leads" },
        () => {
          qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
