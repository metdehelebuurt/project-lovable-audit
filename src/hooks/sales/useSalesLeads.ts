import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { SalesFase } from "@/lib/sales/faseLabels";

export type SalesLead = Database["public"]["Tables"]["affiliate_leads"]["Row"];

const KEY = ["sales-leads"] as const;

/** Alle leads waar superadmin op kan, geordend op laatst bewerkt. */
export function useSalesLeads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SalesLead[]> => {
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateSalesLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; patch: Partial<SalesLead> }) => {
      const { data, error } = await supabase
        .from("affiliate_leads")
        .update(params.patch)
        .eq("id", params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSalesFase() {
  const upd = useUpdateSalesLead();
  return (id: string, fase: SalesFase) => upd.mutate({ id, patch: { sales_fase: fase } });
}

export function useDeleteSalesLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Lead verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Nieuwe lead handmatig aanmaken in sales-pipeline. */
export function useCreateSalesLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SalesLead>) => {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id;
      const { data, error } = await supabase
        .from("affiliate_leads")
        .insert({
          ...input,
          bedrijfsnaam: input.bedrijfsnaam ?? "Onbekend",
          eigenaar_id: uid,
          created_by: uid,
          bron: "sales_admin",
          sales_fase: input.sales_fase ?? "koud",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Lead toegevoegd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}