import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DemoAanvraagInput {
  bedrijfsnaam: string;
  contactpersoon: string;
  email: string;
  telefoon?: string | null;
  branche?: string | null;
  gewenst_moment: string;
  bericht?: string | null;
}

/** Verstuurt een demo-aanvraag vanaf de publieke website. */
export function useDemoAanvraag() {
  return useMutation({
    mutationFn: async (input: DemoAanvraagInput) => {
      const { data, error } = await supabase.functions.invoke("website-demo-aanvraag", { body: input });
      if (error) throw new Error("Aanvraag kon niet worden verstuurd. Probeer het opnieuw.");
      const payload = data as { success?: boolean; error?: string };
      if (!payload?.success) throw new Error(payload?.error ?? "Aanvraag kon niet worden verstuurd.");
      return payload;
    },
  });
}
