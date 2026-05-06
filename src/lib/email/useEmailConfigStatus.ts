import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailConfigStatus {
  configured: boolean;
  provider: "smtp" | "gmail" | "msgraph" | null;
  fromEmail: string | null;
  reason: string | null;
}

/**
 * Pre-flight check: kan deze partner überhaupt e-mail versturen?
 * Wordt gebruikt om verzendknoppen te disablen + duidelijke melding te tonen
 * in plaats van een mysterieuze 400 vanuit de edge function.
 */
export function useEmailConfigStatus(partnerId: string | undefined) {
  return useQuery<EmailConfigStatus>({
    queryKey: ["email-config-status", partnerId],
    enabled: !!partnerId,
    staleTime: 60_000,
    queryFn: async () => {
      const [partnerRes, accountRes] = await Promise.all([
        supabase
          .from("partners")
          .select("email_provider, smtp_host, afzender_email")
          .eq("id", partnerId!)
          .maybeSingle(),
        supabase
          .from("email_accounts")
          .select("provider, email_adres, actief")
          .eq("partner_id", partnerId!)
          .eq("actief", true)
          .maybeSingle(),
      ]);

      const partner = partnerRes.data;
      const account = accountRes.data;

      if (
        account &&
        (partner?.email_provider === "oauth_google" ||
          partner?.email_provider === "oauth_microsoft")
      ) {
        return {
          configured: true,
          provider: account.provider === "google" ? "gmail" : "msgraph",
          fromEmail: account.email_adres,
          reason: null,
        };
      }

      if (partner?.smtp_host && partner?.afzender_email) {
        return {
          configured: true,
          provider: "smtp",
          fromEmail: partner.afzender_email,
          reason: null,
        };
      }

      return {
        configured: false,
        provider: null,
        fromEmail: null,
        reason:
          "E-mailconfiguratie is nog niet ingesteld. Stel SMTP, Gmail of Outlook in via Instellingen → E-mail.",
      };
    },
  });
}
