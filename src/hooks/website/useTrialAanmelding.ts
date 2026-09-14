import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrialAanmeldingInput {
  bedrijfsnaam: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon?: string | null;
  branche?: string | null;
  password: string;
}

/** Maakt een proefaccount aan (14 dagen) en logt de gebruiker direct in. */
export function useTrialAanmelding() {
  return useMutation({
    mutationFn: async (input: TrialAanmeldingInput) => {
      const { data, error } = await supabase.functions.invoke("trial-signup", {
        body: { ...input, trial_dagen: 14, toestemming: true, bron: "selfservice" },
      });
      const payload = data as { success?: boolean; error?: string } | null;
      if (error || !payload?.success) {
        throw new Error(payload?.error ?? "Aanmelden mislukt. Probeer het opnieuw.");
      }
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      return { ingelogd: !loginError };
    },
  });
}
