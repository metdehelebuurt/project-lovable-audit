import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TrialBulkActie = "verleng" | "opgevolgd" | "markeer_verloren";

export interface TrialBulkPayload {
  actie: TrialBulkActie;
  partner_ids: string[];
  dagen?: number;
  notitie?: string;
  reden?: string;
}

export function useTrialBulkActie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TrialBulkPayload) => {
      const { data, error } = await supabase.functions.invoke("sales-trial-bulk-actie", { body: payload });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as { ok: boolean; verwerkt: number };
    },
    onSuccess: (res, vars) => {
      const labels: Record<TrialBulkActie, string> = {
        verleng: `Trial verlengd voor ${res.verwerkt} partners`,
        opgevolgd: `${res.verwerkt} partners gemarkeerd als opgevolgd`,
        markeer_verloren: `${res.verwerkt} trials gemarkeerd als verloren`,
      };
      toast.success(labels[vars.actie]);
      qc.invalidateQueries({ queryKey: ["sales-trials"] });
    },
    onError: (e: Error) => toast.error(e.message || "Bulk-actie mislukt"),
  });
}