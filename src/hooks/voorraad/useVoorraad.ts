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
}

export const useVoorraadOverzicht = (partnerId?: string | null) => {
  return useQuery({
    queryKey: ["voorraad-overzicht", partnerId],
    enabled: !!partnerId,
    queryFn: async (): Promise<VoorraadProductRow[]> => {
      const { data: producten, error } = await supabase
        .from("producten")
        .select("id, naam, merk, model, categorie, voorraad, min_voorraad")
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

      return producten.map((p) => {
        const totaal = standMap.get(p.id) ?? Number(p.voorraad ?? 0);
        const gereserveerd = resMap.get(p.id) ?? 0;
        return {
          id: p.id,
          naam: p.naam,
          merk: p.merk,
          model: p.model,
          categorie: p.categorie,
          voorraad: totaal,
          min_voorraad: Number(p.min_voorraad ?? 0),
          vrij: totaal - gereserveerd,
          gereserveerd,
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
