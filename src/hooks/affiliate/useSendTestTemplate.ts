import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSendTestTemplate() {
  return useMutation({
    mutationFn: async (input: { template_key: string; onderwerp: string; body_html: string; recipient_email?: string }) => {
      const { data, error } = await supabase.functions.invoke("affiliate-template-test-send", {
        body: input,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { ok: true };
    },
    onSuccess: (_d, vars) =>
      toast.success(
        vars.recipient_email
          ? `Testmail verzonden naar ${vars.recipient_email}`
          : "Testmail verzonden naar je eigen inbox",
      ),
    onError: (e: Error) => toast.error(e.message || "Versturen mislukt"),
  });
}
