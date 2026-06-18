import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type AffiliateContact = Database["public"]["Tables"]["affiliate_lead_contactmomenten"]["Row"];
export type AffiliateContactInsert = Database["public"]["Tables"]["affiliate_lead_contactmomenten"]["Insert"];

export function useLeadContactmomenten(leadId: string | undefined) {
  return useQuery({
    queryKey: ["affiliate-lead-contact", leadId],
    enabled: !!leadId,
    queryFn: async (): Promise<AffiliateContact[]> => {
      const { data, error } = await supabase
        .from("affiliate_lead_contactmomenten")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLogContactmoment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<AffiliateContactInsert, "affiliate_id">) => {
      const { data, error } = await supabase.from("affiliate_lead_contactmomenten")
        .insert({ ...input, affiliate_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["affiliate-lead-contact", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}