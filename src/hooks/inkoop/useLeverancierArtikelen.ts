import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeverancierArtikel {
  id: string;
  partner_id: string;
  leverancier_id: string;
  product_id: string;
  leverancier_artikelnummer: string | null;
  inkoopprijs: number;
  min_bestelhoeveelheid: number;
  levertijd_dagen: number | null;
  voorkeur: boolean;
  notities: string | null;
  laatst_gewijzigd: string;
  created_at: string;
  updated_at: string;
}

export interface LeverancierArtikelInput {
  leverancier_id: string;
  product_id: string;
  leverancier_artikelnummer?: string | null;
  inkoopprijs: number;
  min_bestelhoeveelheid?: number;
  levertijd_dagen?: number | null;
  voorkeur?: boolean;
  notities?: string | null;
}

export function useLeverancierArtikelen(params: {
  partnerId: string | undefined;
  leverancierId?: string;
  productId?: string;
}) {
  const { partnerId, leverancierId, productId } = params;
  return useQuery({
    queryKey: ["leverancier-artikelen", partnerId, leverancierId, productId],
    queryFn: async () => {
      if (!partnerId) return [];
      let q = supabase
        .from("leverancier_artikelen")
        .select("*, leveranciers(naam), producten(naam, eenheid)")
        .eq("partner_id", partnerId)
        .order("voorkeur", { ascending: false })
        .order("inkoopprijs", { ascending: true });
      if (leverancierId) q = q.eq("leverancier_id", leverancierId);
      if (productId) q = q.eq("product_id", productId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!partnerId,
  });
}

export function useUpsertLeverancierArtikel(partnerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeverancierArtikelInput & { id?: string }) => {
      if (!partnerId) throw new Error("Geen organisatie");
      const payload = {
        ...input,
        partner_id: partnerId,
        laatst_gewijzigd: new Date().toISOString(),
      };
      if (input.id) {
        const { error } = await supabase
          .from("leverancier_artikelen")
          .update(payload)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("leverancier_artikelen")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leverancier-artikelen"] });
      toast.success("Prijslijst bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLeverancierArtikel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leverancier_artikelen")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leverancier-artikelen"] });
      toast.success("Verwijderd");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export async function suggestLeverancier(productId: string, partnerId: string) {
  const { data, error } = await supabase.rpc("suggest_leverancier", {
    _product_id: productId,
    _partner_id: partnerId,
  });
  if (error) return null;
  return (data && data[0]) || null;
}