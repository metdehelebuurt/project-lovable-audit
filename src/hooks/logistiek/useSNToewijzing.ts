import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { matchProductOpRegel } from "@/lib/voorraad";

export interface SNTarget {
  regelIndex: number;
  regelOmschrijving: string;
  regelAantal: number;
  bundleProductId: string;
  componentProductId: string;
  componentNaam: string;
  componentMerk: string | null;
  perBundel: number;
  benodigd: number;
}

export interface SNRow {
  id: string;
  product_id: string;
  serienummer: string;
  status: string;
  opdracht_id: string | null;
}

export interface SNToewijzingData {
  targets: SNTarget[];
  beschikbaar: Record<string, SNRow[]>; // product_id -> beschikbare (voorraad) SNs
  toegewezen: Record<string, SNRow[]>;  // product_id -> reeds aan deze opdracht toegewezen SNs
}

interface Regel { omschrijving: string; aantal: number }

export const useSNToewijzing = (
  opdrachtId: string,
  partnerId: string,
  regels: Regel[],
) => {
  return useQuery({
    queryKey: ["sn-toewijzing", opdrachtId, partnerId, regels],
    enabled: !!opdrachtId && !!partnerId,
    queryFn: async (): Promise<SNToewijzingData> => {
      const { data: producten } = await supabase
        .from("producten")
        .select("id, naam, merk, model, artikelnummer, ean_code, product_code, is_assemblage, heeft_serienummer")
        .eq("partner_id", partnerId);
      const prodList = (producten || []) as any[];

      // Verzamel component-targets per regel
      const assemblageIds = prodList.filter((p) => p.is_assemblage).map((p) => p.id);
      let compMap: Record<string, Array<{ component_id: string; aantal: number; naam: string; merk: string | null; heeft_sn: boolean }>> = {};
      if (assemblageIds.length) {
        const { data: comps } = await supabase
          .from("product_componenten" as any)
          .select("assemblage_id, component_id, aantal, component:producten!product_componenten_component_id_fkey(id, naam, merk, heeft_serienummer)")
          .in("assemblage_id", assemblageIds);
        (comps || []).forEach((c: any) => {
          const arr = compMap[c.assemblage_id] ?? [];
          arr.push({
            component_id: c.component_id,
            aantal: Number(c.aantal || 0),
            naam: c.component?.naam ?? "Onbekend",
            merk: c.component?.merk ?? null,
            heeft_sn: !!c.component?.heeft_serienummer,
          });
          compMap[c.assemblage_id] = arr;
        });
      }

      const targets: SNTarget[] = [];
      regels.forEach((r, i) => {
        const prod = matchProductOpRegel(r.omschrijving, prodList);
        if (!prod) return;
        const p = prodList.find((x) => x.id === prod.id);
        if (!p) return;
        if (p.is_assemblage) {
          const comps = compMap[p.id] || [];
          comps.filter((c) => c.heeft_sn).forEach((c) => {
            targets.push({
              regelIndex: i,
              regelOmschrijving: r.omschrijving,
              regelAantal: r.aantal,
              bundleProductId: p.id,
              componentProductId: c.component_id,
              componentNaam: c.naam,
              componentMerk: c.merk,
              perBundel: c.aantal,
              benodigd: c.aantal * r.aantal,
            });
          });
        } else if (p.heeft_serienummer) {
          targets.push({
            regelIndex: i,
            regelOmschrijving: r.omschrijving,
            regelAantal: r.aantal,
            bundleProductId: p.id,
            componentProductId: p.id,
            componentNaam: p.naam,
            componentMerk: p.merk,
            perBundel: 1,
            benodigd: r.aantal,
          });
        }
      });

      const productIds = Array.from(new Set(targets.map((t) => t.componentProductId)));
      const beschikbaar: Record<string, SNRow[]> = {};
      const toegewezen: Record<string, SNRow[]> = {};
      if (productIds.length) {
        const { data: sns } = await supabase
          .from("product_serienummers" as any)
          .select("id, product_id, serienummer, status, opdracht_id")
          .in("product_id", productIds)
          .or(`status.eq.voorraad,opdracht_id.eq.${opdrachtId}`)
          .order("created_at", { ascending: true });
        (sns || []).forEach((s: any) => {
          if (s.opdracht_id === opdrachtId) {
            (toegewezen[s.product_id] ||= []).push(s as SNRow);
          } else if (s.status === "voorraad" && !s.opdracht_id) {
            (beschikbaar[s.product_id] ||= []).push(s as SNRow);
          }
        });
      }
      return { targets, beschikbaar, toegewezen };
    },
  });
};

export interface SNAssignment {
  product_id: string;
  serienummer: string;
  existing_id?: string | null;
}

export const useOpslaanSNToewijzing = (opdrachtId: string, partnerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignments: SNAssignment[]) => {
      // 1. Reset huidige toewijzing voor deze opdracht (zet terug op voorraad)
      await supabase
        .from("product_serienummers" as any)
        .update({ opdracht_id: null, status: "voorraad" })
        .eq("opdracht_id", opdrachtId)
        .eq("status", "gereserveerd");

      // 2. Verwerk nieuwe toewijzing
      for (const a of assignments) {
        if (!a.serienummer.trim()) continue;
        if (a.existing_id) {
          const { error } = await supabase
            .from("product_serienummers" as any)
            .update({ opdracht_id: opdrachtId, status: "gereserveerd" })
            .eq("id", a.existing_id);
          if (error) throw error;
        } else {
          // Nieuwe SN: check op duplicaat binnen partner
          const { data: bestaand } = await supabase
            .from("product_serienummers" as any)
            .select("id, opdracht_id, status")
            .eq("partner_id", partnerId)
            .eq("product_id", a.product_id)
            .eq("serienummer", a.serienummer.trim())
            .maybeSingle();
          if (bestaand) {
            const { error } = await supabase
              .from("product_serienummers" as any)
              .update({ opdracht_id: opdrachtId, status: "gereserveerd" })
              .eq("id", (bestaand as any).id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("product_serienummers" as any)
              .insert({
                partner_id: partnerId,
                product_id: a.product_id,
                serienummer: a.serienummer.trim(),
                opdracht_id: opdrachtId,
                status: "gereserveerd",
              });
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sn-toewijzing", opdrachtId] });
      qc.invalidateQueries({ queryKey: ["serienummers-klant"] });
      qc.invalidateQueries({ queryKey: ["serienummers-installatie"] });
    },
  });
};