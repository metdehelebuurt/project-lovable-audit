import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrialHandmatigInput {
  bedrijfsnaam: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon?: string | null;
  password: string;
  trial_dagen: number;
  aangemaakt_door?: string | null;
  aangemaakt_door_id?: string | null;
}

/** Maakt vanuit de platformadmin-omgeving handmatig een trial-account aan (bron: sales). */
export function useTrialHandmatigAanmaken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TrialHandmatigInput) => {
      const { data, error } = await supabase.functions.invoke("trial-signup", {
        body: { ...input, bron: "sales", toestemming: true },
      });
      const payload = data as { success?: boolean; error?: string } | null;
      if (error || !payload?.success) {
        throw new Error(payload?.error ?? error?.message ?? "Trial aanmaken mislukt");
      }
      return payload;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-trials"] });
      toast.success("Trial aangemaakt — de klant ontvangt een welkomstmail");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
