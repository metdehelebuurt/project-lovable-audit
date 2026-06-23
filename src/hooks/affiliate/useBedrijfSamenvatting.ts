import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BedrijfKans = { titel: string; uitleg: string };

export type BedrijfSamenvattingResult = {
  samenvatting: string;
  kansen: BedrijfKans[];
};

/** Genereer (of vernieuw) AI-samenvatting van een bedrijf voor sales. */
export function useGenereerBedrijfSamenvatting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string): Promise<BedrijfSamenvattingResult> => {
      const { data, error } = await supabase.functions.invoke(
        "ai-affiliate-bedrijf-samenvatting",
        { body: { lead_id: leadId } },
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as BedrijfSamenvattingResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      toast.success("AI-samenvatting bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}