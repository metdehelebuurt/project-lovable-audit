import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DocumentType =
  | "offerte" | "orderbevestiging" | "factuur" | "herinnering"
  | "chat_klant" | "chat_lead" | "notificatie" | "algemeen";

export type Bron = "partner_default" | "gebruiker_persoonlijk" | "specifiek_account";

export interface RoutingRow {
  partner_id: string;
  document_type: DocumentType;
  bron: Bron;
  email_account_id: string | null;
  updated_at: string;
}

const DOC_TYPES: DocumentType[] = [
  "offerte", "orderbevestiging", "factuur", "herinnering",
  "chat_klant", "chat_lead", "notificatie", "algemeen",
];

export function useEmailRouting(partnerId: string | undefined) {
  const qc = useQueryClient();
  const queryKey = ["email-routing", partnerId];

  const query = useQuery({
    enabled: !!partnerId,
    queryKey,
    queryFn: async (): Promise<Record<DocumentType, RoutingRow>> => {
      const { data, error } = await supabase
        .from("email_routing_config")
        .select("partner_id, document_type, bron, email_account_id, updated_at")
        .eq("partner_id", partnerId!);
      if (error) throw error;
      const map = {} as Record<DocumentType, RoutingRow>;
      for (const dt of DOC_TYPES) {
        const row = (data || []).find((r) => r.document_type === dt);
        map[dt] = (row as RoutingRow) || {
          partner_id: partnerId!, document_type: dt, bron: "partner_default",
          email_account_id: null, updated_at: new Date().toISOString(),
        };
      }
      return map;
    },
  });

  const update = useMutation({
    mutationFn: async (input: { documentType: DocumentType; bron: Bron; emailAccountId: string | null }) => {
      const { error } = await supabase
        .from("email_routing_config")
        .upsert({
          partner_id: partnerId!,
          document_type: input.documentType,
          bron: input.bron,
          email_account_id: input.bron === "specifiek_account" ? input.emailAccountId : null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Routing bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message || "Kon routing niet opslaan"),
  });

  return { ...query, update, DOC_TYPES };
}