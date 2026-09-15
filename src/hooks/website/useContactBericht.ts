import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactBerichtInput {
  naam: string;
  bedrijfsnaam?: string | null;
  email: string;
  telefoon?: string | null;
  onderwerp?: string | null;
  bericht: string;
}

/** Verstuurt een contactbericht vanaf de publieke website. */
export function useContactBericht() {
  return useMutation({
    mutationFn: async (input: ContactBerichtInput) => {
      const { data, error } = await supabase.functions.invoke("website-contact", { body: input });
      if (error) throw new Error("Bericht kon niet worden verstuurd. Probeer het opnieuw.");
      const payload = data as { success?: boolean; error?: string };
      if (!payload?.success) throw new Error(payload?.error ?? "Bericht kon niet worden verstuurd.");
      return payload;
    },
  });
}
