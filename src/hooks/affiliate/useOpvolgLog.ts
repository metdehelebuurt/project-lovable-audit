import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OpvolgLogEntry = Database["public"]["Tables"]["affiliate_opvolg_log"]["Row"];

export function useOpvolgLog(leadId: string | undefined) {
  return useQuery({
    queryKey: ["affiliate-opvolg-log", leadId],
    enabled: !!leadId,
    queryFn: async (): Promise<OpvolgLogEntry[]> => {
      const { data, error } = await supabase
        .from("affiliate_opvolg_log")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}