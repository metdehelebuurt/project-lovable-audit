import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StartTrialInput {
  lead_id: string;
  bedrijfsnaam: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon?: string | null;
  password: string;
  toestemming: true;
  trial_dagen?: number;
}

export interface StartTrialResult {
  success: true;
  partner_id: string;
  trial_einddatum: string | null;
}

export function useStartTrialVoorLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StartTrialInput): Promise<StartTrialResult> => {
      const { data, error } = await supabase.functions.invoke("affiliate-start-trial", {
        body: input,
      });
      if (error) throw new Error(error.message);
      const payload = data as { success?: boolean; partner_id?: string; trial_einddatum?: string | null; error?: { message?: string } };
      if (!payload?.success || !payload.partner_id) {
        throw new Error(payload?.error?.message ?? "Trial starten mislukt");
      }
      return {
        success: true,
        partner_id: payload.partner_id,
        trial_einddatum: payload.trial_einddatum ?? null,
      };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      qc.invalidateQueries({ queryKey: ["affiliate-lead-contact", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["affiliate-trials"] });
      toast.success("Trial gestart — klant ontvangt een welkomstmail");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}