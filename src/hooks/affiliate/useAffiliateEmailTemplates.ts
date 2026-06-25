import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface AffiliateEmailTemplateRow {
  id: string;
  user_id: string;
  template_key: string;
  onderwerp: string;
  body_html: string;
  afzender_naam: string | null;
  actief: boolean;
  actie_default: string | null;
  updated_at: string;
}

export function useAffiliateEmailTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["affiliate-email-templates", user?.id];

  const query = useQuery({
    enabled: !!user?.id,
    queryKey,
    queryFn: async (): Promise<Record<string, AffiliateEmailTemplateRow>> => {
      const { data, error } = await supabase
        .from("affiliate_email_templates")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: Record<string, AffiliateEmailTemplateRow> = {};
      for (const r of data || []) map[r.template_key] = r as AffiliateEmailTemplateRow;
      return map;
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: {
      template_key: string;
      onderwerp: string;
      body_html: string;
      afzender_naam?: string | null;
      actief?: boolean;
      actie_default?: string | null;
    }) => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("affiliate_email_templates")
        .upsert(
          {
            user_id: user.id,
            template_key: input.template_key,
            onderwerp: input.onderwerp,
            body_html: input.body_html,
            afzender_naam: input.afzender_naam ?? null,
            actief: input.actief ?? true,
            ...(input.actie_default !== undefined ? { actie_default: input.actie_default } : {}),
          },
          { onConflict: "user_id,template_key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Template opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: async (template_key: string) => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("affiliate_email_templates")
        .delete()
        .eq("user_id", user.id)
        .eq("template_key", template_key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Standaardtekst hersteld");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, upsert, reset };
}
