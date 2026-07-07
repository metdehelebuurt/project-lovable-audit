import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBerekenDealRisico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke("sales-deal-risico", {
        body: { lead_id: leadId },
      });
      if (error) throw error;
      return data as { risico_score: string; risico_reden: string; risico_next_step: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success("Risico bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}