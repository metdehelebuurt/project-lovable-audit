import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AiSessieType = "troubleshooter" | "foutcode" | "kbartikel" | "bijlage";

export interface AiSessie {
  id: string;
  ticket_id: string;
  type: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  gerelateerde_tickets: Array<{ id: string; ticketnummer: string; titel: string }> | null;
  model: string | null;
  created_at: string;
  user_id: string;
}

export function useTicketAiSessies(ticketId: string, type?: AiSessieType) {
  return useQuery({
    queryKey: ["helpdesk_ticket_ai_sessies", ticketId, type ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("helpdesk_ticket_ai_sessies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });
      if (type) q = q.eq("type", type);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AiSessie[];
    },
    enabled: !!ticketId,
  });
}