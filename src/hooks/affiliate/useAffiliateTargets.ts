import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type AffiliateTarget = Database["public"]["Tables"]["affiliate_targets"]["Row"];
type Upsert = Database["public"]["Tables"]["affiliate_targets"]["Insert"];

export function useAffiliateTargets(affiliateId?: string) {
  return useQuery({
    queryKey: ["affiliate-targets", affiliateId],
    enabled: !!affiliateId,
    queryFn: async (): Promise<AffiliateTarget[]> => {
      const { data, error } = await supabase
        .from("affiliate_targets")
        .select("*")
        .eq("affiliate_id", affiliateId!)
        .order("jaar", { ascending: false })
        .order("maand", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Upsert) => {
      const { error } = await supabase
        .from("affiliate_targets")
        .upsert(row, { onConflict: "affiliate_id,jaar,maand" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["affiliate-targets", vars.affiliate_id] });
      toast.success("Target opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
