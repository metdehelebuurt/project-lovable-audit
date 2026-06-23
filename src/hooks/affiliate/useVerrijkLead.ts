import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VerrijkSuggesties = {
  email: string | null;
  telefoon: string | null;
  website: string | null;
  contactpersoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  branche: string | null;
  samenvatting: string | null;
};

export type VerrijkResult = {
  suggesties: VerrijkSuggesties | null;
  bronnen: number;
  bron_urls?: (string | null)[];
  melding?: string;
};

export function useVerrijkLead() {
  return useMutation({
    mutationFn: async (lead_id: string): Promise<VerrijkResult> => {
      const { data, error } = await supabase.functions.invoke("affiliate-lead-verrijken", {
        body: { lead_id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Verrijken mislukt");
      return data as VerrijkResult;
    },
  });
}