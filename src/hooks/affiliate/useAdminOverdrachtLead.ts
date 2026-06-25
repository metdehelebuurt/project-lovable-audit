import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminOverdrachtLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      lead_id: string;
      nieuwe_eigenaar_id: string;
      notitie?: string | null;
    }) => {
      const { data, error } = await (supabase.rpc as any)("admin_overdracht_affiliate_lead", {
        _lead_id: input.lead_id,
        _nieuwe_eigenaar_id: input.nieuwe_eigenaar_id,
        _notitie: input.notitie ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["affiliate-lead", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      qc.invalidateQueries({ queryKey: ["lead-historie", vars.lead_id] });
      toast.success("Lead overgedragen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface AffiliateOptie {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string;
}

export async function fetchAffiliateOpties(): Promise<AffiliateOptie[]> {
  const { data, error } = await (supabase.rpc as any)("lijst_affiliates_voor_sales_admin");
  if (error) throw error;
  return (data ?? []) as AffiliateOptie[];
}