import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductComponentInfo {
  component_id: string;
  aantal: number;
  verplicht: boolean;
  volgorde: number;
  naam: string;
  merk: string | null;
  heeft_serienummer: boolean;
}

export interface ProductMeta {
  id: string;
  kostprijs: number | null;
  is_assemblage: boolean;
  heeft_serienummer: boolean;
  componenten: ProductComponentInfo[];
}

/**
 * Batch-fetch productmeta (kostprijs, assemblage-info, componenten) voor een lijst product_ids.
 * Wordt gebruikt door editor + PDF-renders om assemblages 'uit te klappen'.
 */
export function useProductMetaMap(productIds: string[]) {
  const key = [...new Set(productIds)].filter(Boolean).sort();
  return useQuery({
    queryKey: ["product-meta-map", key],
    enabled: key.length > 0,
    queryFn: async (): Promise<Record<string, ProductMeta>> => {
      const { data: prods, error } = await supabase
        .from("producten")
        .select("id, kostprijs, is_assemblage, heeft_serienummer")
        .in("id", key);
      if (error) throw error;
      const map: Record<string, ProductMeta> = {};
      const assemblageIds: string[] = [];
      for (const p of (prods ?? []) as { id: string; kostprijs: number | null; is_assemblage: boolean | null; heeft_serienummer: boolean | null }[]) {
        map[p.id] = {
          id: p.id,
          kostprijs: p.kostprijs != null ? Number(p.kostprijs) : null,
          is_assemblage: !!p.is_assemblage,
          heeft_serienummer: !!p.heeft_serienummer,
          componenten: [],
        };
        if (p.is_assemblage) assemblageIds.push(p.id);
      }
      if (assemblageIds.length > 0) {
        const { data: comps } = await supabase
          .from("product_componenten" as never)
          .select("assemblage_id, component_id, aantal, verplicht, volgorde, component:producten!product_componenten_component_id_fkey(naam, merk, heeft_serienummer)")
          .in("assemblage_id", assemblageIds)
          .order("volgorde");
        for (const c of (comps ?? []) as Array<{
          assemblage_id: string;
          component_id: string;
          aantal: number;
          verplicht: boolean | null;
          volgorde: number | null;
          component: { naam: string; merk: string | null; heeft_serienummer: boolean | null } | null;
        }>) {
          const parent = map[c.assemblage_id];
          if (!parent) continue;
          parent.componenten.push({
            component_id: c.component_id,
            aantal: Number(c.aantal || 0),
            verplicht: !!c.verplicht,
            volgorde: Number(c.volgorde || 0),
            naam: c.component?.naam ?? "Onbekend",
            merk: c.component?.merk ?? null,
            heeft_serienummer: !!c.component?.heeft_serienummer,
          });
        }
      }
      return map;
    },
    staleTime: 60_000,
  });
}