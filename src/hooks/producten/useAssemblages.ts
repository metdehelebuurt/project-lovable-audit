import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AssemblageProduct {
  id: string;
  naam: string;
  merk: string | null;
  categorie: string;
  prijs_excl_btw: number | null;
  kostprijs: number | null;
  prijs_strategie: "vast" | "som_componenten";
  marge_opslag_percentage: number;
  status: string;
  afbeelding_url: string | null;
  aantal_componenten?: number;
  som_kostprijs?: number;
}

export interface ProductComponent {
  id: string;
  assemblage_id: string;
  component_id: string;
  aantal: number;
  verplicht: boolean;
  volgorde: number;
  component?: {
    id: string;
    naam: string;
    merk: string | null;
    prijs_excl_btw: number | null;
    kostprijs: number | null;
    heeft_serienummer: boolean;
    voorraad: number | null;
    levertijd: string | null;
    garantie_jaren: number | null;
  };
}

export const useAssemblages = (partnerId?: string | null) => {
  return useQuery({
    queryKey: ["assemblages", partnerId],
    enabled: !!partnerId,
    queryFn: async (): Promise<AssemblageProduct[]> => {
      const { data, error } = await supabase
        .from("producten")
        .select("id, naam, merk, categorie, prijs_excl_btw, kostprijs, prijs_strategie, marge_opslag_percentage, status, afbeelding_url")
        .eq("partner_id", partnerId!)
        .eq("is_assemblage" as any, true)
        .order("naam");
      if (error) throw error;
      const rows = (data || []) as any[];
      if (!rows.length) return [];
      const ids = rows.map((r) => r.id);
      const { data: comps } = await supabase
        .from("product_componenten" as any)
        .select("assemblage_id, aantal, component:producten!product_componenten_component_id_fkey(kostprijs)")
        .in("assemblage_id", ids);
      const map = new Map<string, { count: number; som: number }>();
      (comps || []).forEach((c: any) => {
        const cur = map.get(c.assemblage_id) ?? { count: 0, som: 0 };
        cur.count += 1;
        cur.som += Number(c.aantal || 0) * Number(c.component?.kostprijs || 0);
        map.set(c.assemblage_id, cur);
      });
      return rows.map((r) => ({
        id: r.id,
        naam: r.naam,
        merk: r.merk,
        categorie: r.categorie,
        prijs_excl_btw: r.prijs_excl_btw != null ? Number(r.prijs_excl_btw) : null,
        kostprijs: r.kostprijs != null ? Number(r.kostprijs) : null,
        prijs_strategie: (r.prijs_strategie as "vast" | "som_componenten") ?? "vast",
        marge_opslag_percentage: Number(r.marge_opslag_percentage ?? 0),
        status: r.status,
        afbeelding_url: r.afbeelding_url,
        aantal_componenten: map.get(r.id)?.count ?? 0,
        som_kostprijs: map.get(r.id)?.som ?? 0,
      }));
    },
  });
};

export const useAssemblageComponenten = (assemblageId?: string | null) => {
  return useQuery({
    queryKey: ["assemblage-componenten", assemblageId],
    enabled: !!assemblageId,
    queryFn: async (): Promise<ProductComponent[]> => {
      const { data, error } = await supabase
        .from("product_componenten" as any)
        .select("id, assemblage_id, component_id, aantal, verplicht, volgorde, component:producten!product_componenten_component_id_fkey(id, naam, merk, prijs_excl_btw, kostprijs, heeft_serienummer, voorraad, levertijd, garantie_jaren)")
        .eq("assemblage_id", assemblageId!)
        .order("volgorde");
      if (error) throw error;
      return (data || []) as any as ProductComponent[];
    },
  });
};

export const useAddComponent = (partnerId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { assemblage_id: string; component_id: string; aantal: number }) => {
      const { error } = await supabase.from("product_componenten" as any).insert({
        partner_id: partnerId,
        assemblage_id: input.assemblage_id,
        component_id: input.component_id,
        aantal: input.aantal,
        volgorde: Date.now(),
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["assemblage-componenten", v.assemblage_id] });
      qc.invalidateQueries({ queryKey: ["assemblages"] });
      toast.success("Component toegevoegd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateComponent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; aantal?: number; verplicht?: boolean; assemblage_id: string }) => {
      const patch: Record<string, unknown> = {};
      if (input.aantal !== undefined) patch.aantal = input.aantal;
      if (input.verplicht !== undefined) patch.verplicht = input.verplicht;
      const { error } = await supabase.from("product_componenten" as any).update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["assemblage-componenten", v.assemblage_id] }),
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useRemoveComponent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; assemblage_id: string }) => {
      const { error } = await supabase.from("product_componenten" as any).delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["assemblage-componenten", v.assemblage_id] });
      qc.invalidateQueries({ queryKey: ["assemblages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDuplicateAssemblage = (partnerId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assemblageId: string) => {
      const { data: bron, error } = await supabase.from("producten").select("*").eq("id", assemblageId).single();
      if (error) throw error;
      const { id, created_at, updated_at, ...rest } = bron as any;
      const insertPayload = { ...rest, naam: `${bron.naam} (kopie)`, partner_id: partnerId };
      const { data: nieuw, error: e2 } = await supabase.from("producten").insert(insertPayload).select("id").single();
      if (e2) throw e2;
      const { data: comps } = await supabase.from("product_componenten" as any).select("component_id, aantal, verplicht, volgorde").eq("assemblage_id", assemblageId);
      if (comps && comps.length) {
        const rows = comps.map((c: any) => ({ ...c, assemblage_id: nieuw!.id, partner_id: partnerId }));
        await supabase.from("product_componenten" as any).insert(rows);
      }
      return nieuw!.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assemblages"] });
      qc.invalidateQueries({ queryKey: ["producten"] });
      toast.success("Assemblage gedupliceerd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export interface KostprijsHistorieRow {
  id: string;
  oude_kostprijs: number | null;
  nieuwe_kostprijs: number;
  gewijzigd_door: string | null;
  created_at: string;
  gewijzigd_door_naam?: string;
}

export const useKostprijsHistorie = (productId?: string | null) => {
  return useQuery({
    queryKey: ["kostprijs-historie", productId],
    enabled: !!productId,
    queryFn: async (): Promise<KostprijsHistorieRow[]> => {
      const { data, error } = await supabase
        .from("product_kostprijs_historie" as any)
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data || []) as any[];
      const ids = Array.from(new Set(rows.map((r) => r.gewijzigd_door).filter(Boolean)));
      const nameMap = new Map<string, string>();
      if (ids.length) {
        const { data: users } = await supabase.from("users").select("id, voornaam, achternaam").in("id", ids);
        (users || []).forEach((u: any) => nameMap.set(u.id, `${u.voornaam ?? ""} ${u.achternaam ?? ""}`.trim()));
      }
      return rows.map((r) => ({ ...r, gewijzigd_door_naam: r.gewijzigd_door ? nameMap.get(r.gewijzigd_door) : undefined }));
    },
  });
};