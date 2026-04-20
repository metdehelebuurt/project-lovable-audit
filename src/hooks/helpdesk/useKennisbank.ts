import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type KennisArtikel = {
  id: string;
  partner_id: string;
  titel: string;
  samenvatting: string | null;
  probleem: string | null;
  oplossing: string | null;
  product_categorie: string | null;
  product_merk: string | null;
  product_type: string | null;
  foutcode: string | null;
  tags: unknown;
  status: string;
  bron_ticket_id: string | null;
  ai_gegenereerd: boolean;
  gemaakt_door: string | null;
  goedgekeurd_door: string | null;
  goedgekeurd_op: string | null;
  views: number;
  created_at: string;
  updated_at: string;
};

export function useKennisArtikelen(opts: { status?: string; zoekterm?: string; categorie?: string } = {}) {
  return useQuery({
    queryKey: ["helpdesk_kennis", opts],
    queryFn: async () => {
      let q = supabase.from("helpdesk_kennis_artikelen").select("*").order("updated_at", { ascending: false });
      if (opts.status) q = q.eq("status", opts.status as never);
      if (opts.categorie) q = q.eq("product_categorie", opts.categorie);
      if (opts.zoekterm) q = q.or(`titel.ilike.%${opts.zoekterm}%,probleem.ilike.%${opts.zoekterm}%,oplossing.ilike.%${opts.zoekterm}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as KennisArtikel[];
    },
  });
}

export function useKennisArtikel(id: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_kennis", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_kennis_artikelen")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as KennisArtikel | null;
    },
  });
}

export function useUpdateKennisArtikel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<KennisArtikel> & { id: string }) => {
      const { data, error } = await supabase
        .from("helpdesk_kennis_artikelen")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as KennisArtikel;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["helpdesk_kennis"] });
      toast.success("Artikel bijgewerkt");
    },
    onError: (e: Error) => toast.error(`Bijwerken mislukt: ${e.message}`),
  });
}