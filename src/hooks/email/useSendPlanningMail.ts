import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SendPlanningMailInput {
  to: string;
  subject: string;
  html: string;
  rol: "klant" | "collega";
  afspraakType: "demo" | "terugbel" | "trial";
  leadId?: string | null;
  affiliateLeadId?: string | null;
}

/**
 * Verstuurt één planning-mail vanuit het persoonlijke mailaccount van de
 * ingelogde gebruiker (Gmail OAuth → App Password → Microsoft). Reuses
 * de bestaande `email-api-send` Edge Function zodat we niet twee
 * verschillende verzendpaden onderhouden.
 */
export function useSendPlanningMail() {
  return useMutation({
    mutationFn: async (input: SendPlanningMailInput) => {
      const { data, error } = await supabase.functions.invoke("email-api-send", {
        body: {
          to: input.to,
          subject: input.subject,
          html_body: input.html,
          lead_id: input.leadId ?? null,
          affiliate_lead_id: input.affiliateLeadId ?? null,
          document_type: input.rol === "collega" ? "intern" : "chat_lead",
        },
      });
      if (error) throw error;
      const payload = data as { success?: boolean; method?: string; error?: string };
      if (!payload?.success) throw new Error(payload?.error ?? "Versturen mislukt");
      return payload;
    },
  });
}