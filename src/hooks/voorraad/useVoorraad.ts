import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VoorraadMutatie } from "@/lib/voorraad";

export interface VoorraadProductRow {
  id: string;
  naam: string;
  merk: string | null;
  model: string | null;
  categorie: string;
  voorraad: number;
  min_voorraad: number;
  vrij: number;
  gereserveerd: number;
  is_assemblage: boolean;
  bottleneck?: {
    component_id: string;
    naam: string;
    beschikbaar: number;
    nodig_per_bundel: number;
  } | null;
  componenten?: Array<{
    component_id: string;
    naam: string;
    merk: string | null;
    aantal_per_bundel: number;
    vrij: number;
    bundels_dekking: number;
  }>;
}

export const useVoorraadOverzicht = (partnerId?: string | null) => {
  return useQuery({
    queryKey: ["voorraad-overzicht", partnerId],
    enabled: !!partnerId,
    queryFn: async (): Promise<VoorraadProductRow[]> => {
      const { data: producten, error } = await supabase
        .from("producten")
        .select("id, naam, merk, model, categorie, voorraad, min_voorraad, is_assemblage")
        .eq("partner_id", partnerId!)
        .order("naam");
      if (error) throw error;
      if (!producten?.length) return [];

      const ids = producten.map((p) => p.id);
      const { data: muts } = await supabase
        .from("voorraad_mutaties" as any)
        .select("product_id, type, aantal")
        .in("product_id", ids);
      const { data: res } = await supabase
        .from("voorraad_reserveringen" as any)
        .select("product_id, aantal")
        .in("product_id", ids)
        .eq("status", "actief");

      const standMap = new Map<string, number>();
      (muts || []).forEach((m: any) => {
        const cur = standMap.get(m.product_id) ?? 0;
        const a = Number(m.aantal);
        if (m.type === "inkomend" || m.type === "vrijgave" || m.type === "correctie") {
          standMap.set(m.product_id, cur + a);
        } else if (m.type === "uitgaand" || m.type === "reservering") {
          standMap.set(m.product_id, cur - a);
        }
      });
      const resMap = new Map<string, number>();
      (res || []).forEach((r: any) => {
        resMap.set(r.product_id, (resMap.get(r.product_id) ?? 0) + Number(r.aantal));
      });

      // Bereken eerst standen per product (componenten-niveau).
      const stand = new Map<string, { totaal: number; gereserveerd: number; vrij: number }>();
      for (const p of producten as Array<{ id: string; voorraad: number | null }>) {
        const totaal = standMap.get(p.id) ?? Number(p.voorraad ?? 0);
        const gereserveerd = resMap.get(p.id) ?? 0;
        stand.set(p.id, { totaal, gereserveerd, vrij: totaal - gereserveerd });
      }

      // Haal componenten-stuklijst op voor alle assemblages in één query.
      const assemblageIds = (producten as any[]).filter((p) => p.is_assemblage).map((p) => p.id);
      const compMap = new Map<string, Array<{ component_id: string; aantal: number; naam: string; merk: string | null }>>();
      if (assemblageIds.length) {
        const { data: comps } = await supabase
          .from("product_componenten" as any)
          .select("assemblage_id, component_id, aantal, component:producten!product_componenten_component_id_fkey(id, naam, merk)")
          .in("assemblage_id", assemblageIds);
        (comps || []).forEach((c: any) => {
          const arr = compMap.get(c.assemblage_id) ?? [];
          arr.push({
            component_id: c.component_id,
            aantal: Number(c.aantal || 0),
            naam: c.component?.naam ?? "Onbekend",
            merk: c.component?.merk ?? null,
          });
          compMap.set(c.assemblage_id, arr);
        });
      }

      return (producten as any[]).map((p) => {
        const totaal = standMap.get(p.id) ?? Number(p.voorraad ?? 0);
        const gereserveerd = resMap.get(p.id) ?? 0;
        const baseRow = {
          id: p.id,
          naam: p.naam,
          merk: p.merk,
          model: p.model,
          categorie: p.categorie,
          voorraad: totaal,
          min_voorraad: Number(p.min_voorraad ?? 0),
          vrij: totaal - gereserveerd,
          gereserveerd,
          is_assemblage: !!p.is_assemblage,
          bottleneck: null as VoorraadProductRow["bottleneck"],
          componenten: undefined as VoorraadProductRow["componenten"],
        };
        if (!p.is_assemblage) return baseRow;

        // Rollup: min-over-componenten van floor(vrij / aantal_per_bundel).
        const comps = compMap.get(p.id) ?? [];
        if (comps.length === 0) return baseRow;
        let minBundelsVrij = Infinity;
        let minBundelsTotaal = Infinity;
        let bottleneck: VoorraadProductRow["bottleneck"] = null;
        const componentenBreakdown = comps.map((c) => {
          const s = stand.get(c.component_id) ?? { totaal: 0, gereserveerd: 0, vrij: 0 };
          const dekking = c.aantal > 0 ? Math.floor(s.vrij / c.aantal) : 0;
          const dekkingTotaal = c.aantal > 0 ? Math.floor(s.totaal / c.aantal) : 0;
          if (dekking < minBundelsVrij) {
            minBundelsVrij = dekking;
            bottleneck = {
              component_id: c.component_id,
              naam: [c.merk, c.naam].filter(Boolean).join(" ") || c.naam,
              beschikbaar: s.vrij,
              nodig_per_bundel: c.aantal,
            };
          }
          if (dekkingTotaal < minBundelsTotaal) minBundelsTotaal = dekkingTotaal;
          return {
            component_id: c.component_id,
            naam: [c.merk, c.naam].filter(Boolean).join(" ") || c.naam,
            merk: c.merk,
            aantal_per_bundel: c.aantal,
            vrij: s.vrij,
            bundels_dekking: dekking,
          };
        });
        const rollupVrij = Number.isFinite(minBundelsVrij) ? Math.max(0, minBundelsVrij) : 0;
        const rollupTotaal = Number.isFinite(minBundelsTotaal) ? Math.max(0, minBundelsTotaal) : 0;
        return {
          ...baseRow,
          vrij: rollupVrij,
          voorraad: rollupTotaal,
          gereserveerd: Math.max(0, rollupTotaal - rollupVrij),
          bottleneck,
          componenten: componentenBreakdown,
        };
      });
    },
  });
};

export const useProductMutaties = (productId?: string | null) => {
  return useQuery({
    queryKey: ["voorraad-mutaties", productId],
    enabled: !!productId,
    queryFn: async (): Promise<(VoorraadMutatie & { actor_naam?: string })[]> => {
      const { data, error } = await supabase
        .from("voorraad_mutaties" as any)
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const muts = (data || []) as any[];
      const actorIds = Array.from(
        new Set(muts.map((m) => m.actor_id).filter(Boolean)),
      );
      let nameMap = new Map<string, string>();
      if (actorIds.length) {
        const { data: users } = await supabase
          .from("users")
          .select("id, voornaam, achternaam")
          .in("id", actorIds);
        (users || []).forEach((u: any) => {
          nameMap.set(u.id, `${u.voornaam ?? ""} ${u.achternaam ?? ""}`.trim());
        });
      }
      return muts.map((m) => ({
        ...m,
        actor_naam: m.actor_id ? nameMap.get(m.actor_id) : undefined,
      }));
    },
  });
};
