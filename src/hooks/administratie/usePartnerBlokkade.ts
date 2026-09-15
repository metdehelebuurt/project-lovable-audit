import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlokkadeInvoer {
  partnerId: string;
  actie: "blokkeren" | "deblokkeren";
  reden: string;
}

/** Blokkeert of deblokkeert een klantorganisatie via de beveiligde serverfunctie. */
export function usePartnerBlokkade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, actie, reden }: BlokkadeInvoer) => {
      const { data, error } = await supabase.functions.invoke("partner-blokkade", {
        body: { partner_id: partnerId, actie, reden },
      });
      if (error) throw new Error(error.message);
      const fout = (data as { error?: { message?: string } } | null)?.error;
      if (fout) throw new Error(fout.message ?? "Actie mislukt");
      return data;
    },
    onSuccess: (_data, variabelen) => {
      qc.invalidateQueries({ queryKey: ["partner-administratie"] });
      qc.invalidateQueries({ queryKey: ["partner-blokkades"] });
      qc.invalidateQueries({ queryKey: ["partner-blokkadestatus"] });
      toast.success(variabelen.actie === "blokkeren" ? "Organisatie geblokkeerd" : "Blokkade opgeheven");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
