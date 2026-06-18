import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";

export type AffiliateLead = Database["public"]["Tables"]["affiliate_leads"]["Row"];
export type AffiliateLeadInsert = Database["public"]["Tables"]["affiliate_leads"]["Insert"];
export type AffiliateLeadUpdate = Database["public"]["Tables"]["affiliate_leads"]["Update"];

const KEY = ["affiliate-leads"] as const;

export function useAffiliateLeads(scope: "mine" | "pool" | "all" = "mine") {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, scope, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<AffiliateLead[]> => {
      let query = supabase.from("affiliate_leads").select("*").order("updated_at", { ascending: false });
      if (scope === "mine") query = query.eq("eigenaar_id", user!.id);
      if (scope === "pool") query = query.is("eigenaar_id", null);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateAffiliateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (
      input: Omit<AffiliateLeadInsert, "eigenaar_id" | "bron" | "created_by"> & {
        _bestemming?: "mine" | "pool";
      },
    ) => {
      const { _bestemming, ...rest } = input;
      const { data, error } = await supabase.from("affiliate_leads").insert({
        ...rest,
        eigenaar_id: _bestemming === "pool" ? null : user!.id,
        created_by: user!.id,
        bron: "eigen_import",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAffiliateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: AffiliateLeadUpdate }) => {
      const { data, error } = await supabase.from("affiliate_leads").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useClaimAffiliateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead_id: string) => {
      const { data, error } = await supabase.rpc("claim_affiliate_lead", { _lead_id: lead_id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Lead geclaimd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeadStatus() {
  const upd = useUpdateAffiliateLead();
  return (id: string, status: AffiliateLeadStatus) => upd.mutate({ id, patch: { status } });
}