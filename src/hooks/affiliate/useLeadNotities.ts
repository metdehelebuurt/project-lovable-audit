import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LeadNotitie {
  id: string;
  lead_id: string;
  affiliate_id: string | null;
  notitie: string;
  created_at: string;
  auteur_naam: string;
  is_eigen: boolean;
}

const KEY = (leadId: string) => ["affiliate-lead-notities", leadId] as const;

export function useLeadNotities(leadId: string) {
  return useQuery({
    queryKey: KEY(leadId),
    enabled: !!leadId,
    queryFn: async (): Promise<LeadNotitie[]> => {
      const { data, error } = await supabase.rpc("get_affiliate_lead_notities", { _lead_id: leadId });
      if (error) throw error;
      return (data ?? []) as LeadNotitie[];
    },
  });
}

export function useVoegLeadNotitieToe(leadId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tekst: string) => {
      const schoon = tekst.trim();
      if (!schoon) throw new Error("Notitie is leeg");
      const { error } = await supabase.from("affiliate_lead_contactmomenten").insert({
        lead_id: leadId,
        affiliate_id: user!.id,
        type: "notitie",
        notitie: schoon,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(leadId) });
      qc.invalidateQueries({ queryKey: ["lead-tijdlijn", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVerwijderLeadNotitie(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_lead_contactmomenten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(leadId) });
      qc.invalidateQueries({ queryKey: ["lead-tijdlijn", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}