import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductSerienummer {
  id: string;
  partner_id: string;
  product_id: string;
  serienummer: string;
  opdracht_id: string | null;
  installatie_id: string | null;
  klant_id: string | null;
  zending_id: string | null;
  levering_datum: string | null;
  garantie_einddatum: string | null;
  garantie_maanden: number | null;
  status: "voorraad" | "geleverd" | "geinstalleerd" | "retour" | "defect";
  notitie: string | null;
  created_at: string;
  // joined
  product_naam?: string;
  product_merk?: string | null;
  product_model?: string | null;
}

const selectMetProduct = "*, producten(naam, merk, model)";

const mapRow = (r: any): ProductSerienummer => ({
  ...r,
  product_naam: r.producten?.naam,
  product_merk: r.producten?.merk ?? null,
  product_model: r.producten?.model ?? null,
});

export const useSerienummersVoorKlant = (klantId?: string | null, leadId?: string | null) => {
  return useQuery({
    queryKey: ["serienummers-klant", klantId, leadId],
    enabled: !!(klantId || leadId),
    queryFn: async (): Promise<ProductSerienummer[]> => {
      // Verzamel alle serienummers waar deze klant aan gekoppeld is, of via opdrachten via lead_id
      let q = supabase.from("product_serienummers" as any).select(selectMetProduct);
      if (klantId && leadId) {
        // serienr direct op klant_id OF via opdracht.lead_id
        const { data: opdrachten } = await supabase
          .from("opdrachten")
          .select("id")
          .eq("lead_id", leadId);
        const opdrachtIds = (opdrachten ?? []).map((o: any) => o.id);
        const orFilter = [`klant_id.eq.${klantId}`];
        if (opdrachtIds.length) orFilter.push(`opdracht_id.in.(${opdrachtIds.join(",")})`);
        q = q.or(orFilter.join(","));
      } else if (klantId) {
        q = q.eq("klant_id", klantId);
      } else if (leadId) {
        const { data: opdrachten } = await supabase
          .from("opdrachten")
          .select("id")
          .eq("lead_id", leadId);
        const opdrachtIds = (opdrachten ?? []).map((o: any) => o.id);
        if (!opdrachtIds.length) return [];
        q = q.in("opdracht_id", opdrachtIds);
      }
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
};

export const useSerienummersVoorInstallatie = (installatieId?: string | null) => {
  return useQuery({
    queryKey: ["serienummers-installatie", installatieId],
    enabled: !!installatieId,
    queryFn: async (): Promise<ProductSerienummer[]> => {
      const { data, error } = await supabase
        .from("product_serienummers" as any)
        .select(selectMetProduct)
        .eq("installatie_id", installatieId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
};

export const useUpsertSerienummer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ProductSerienummer> & {
      partner_id: string;
      product_id: string;
      serienummer: string;
    }) => {
      const { id, product_naam: _n, product_merk: _m, product_model: _mo, ...rest } = input as any;
      if (id) {
        const { error } = await supabase
          .from("product_serienummers" as any)
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_serienummers" as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Serienummer opgeslagen");
      qc.invalidateQueries({ queryKey: ["serienummers-klant"] });
      qc.invalidateQueries({ queryKey: ["serienummers-installatie"] });
    },
    onError: (e: any) => {
      if (e.message?.includes("duplicate")) {
        toast.error("Dit serienummer bestaat al voor dit product");
      } else {
        toast.error(e.message ?? "Fout bij opslaan");
      }
    },
  });
};

export const useDeleteSerienummer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_serienummers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serienummer verwijderd");
      qc.invalidateQueries({ queryKey: ["serienummers-klant"] });
      qc.invalidateQueries({ queryKey: ["serienummers-installatie"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fout"),
  });
};