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
    const channelName = `affiliate-leads-rt:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
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
