import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BelBriefing = {
  samenvatting: string;
  gesprekspunten: string[];
  mogelijke_bezwaren: string[];
  usps: string[];
  aanbevolen_volgende_actie: string;
};

export function useBelBriefing() {
  return useMutation({
    mutationFn: async (lead_id: string): Promise<BelBriefing> => {
      const { data, error } = await supabase.functions.invoke("affiliate-bel-briefing", {
        body: { lead_id },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as BelBriefing;
    },
    onError: (e: Error) => toast.error(`Briefing mislukt: ${e.message}`),
  });
}