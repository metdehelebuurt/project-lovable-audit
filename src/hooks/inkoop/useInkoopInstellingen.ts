import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InkoopInstellingen {
  partner_id: string;
  goedkeuring_modus: "geen" | "drempel" | "altijd";
  goedkeuring_drempel_bedrag: number;
  verzend_modus: "eigen_email" | "pdf_download";
  auto_voorstellen: boolean;
  leveringsadres: { straat?: string; postcode?: string; plaats?: string; land?: string } | null;
  standaard_betalingstermijn_dagen: number;
  standaard_email_template: string | null;
  vereist_leverancier_bevestiging: boolean;
}

const DEFAULTS: Omit<InkoopInstellingen, "partner_id"> = {
  goedkeuring_modus: "geen",
  goedkeuring_drempel_bedrag: 1000,
  verzend_modus: "eigen_email",
  auto_voorstellen: true,
  leveringsadres: null,
  standaard_betalingstermijn_dagen: 30,
  standaard_email_template: null,
  vereist_leverancier_bevestiging: false,
};

export function useInkoopInstellingen(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["inkoop-instellingen", partnerId],
    enabled: !!partnerId,
    queryFn: async (): Promise<InkoopInstellingen> => {
      const { data, error } = await supabase
        .from("inkoop_instellingen" as any)
        .select("*")
        .eq("partner_id", partnerId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { partner_id: partnerId!, ...DEFAULTS };
      return data as unknown as InkoopInstellingen;
    },
  });
}

export function useSaveInkoopInstellingen(partnerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<InkoopInstellingen>) => {
      if (!partnerId) throw new Error("Geen organisatie");
      const { error } = await supabase
        .from("inkoop_instellingen" as any)
        .upsert({ partner_id: partnerId, ...DEFAULTS, ...patch }, { onConflict: "partner_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkoop-instellingen", partnerId] });
      toast.success("Inkoop-instellingen opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}