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

interface Regel { omschrijving: string; aantal: number; product_id?: string | null }

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
        .select("id, naam, merk, model, artikelnummer, ean_code, product_code, is_assemblage, heeft_serienummer, omvormer_modulair, heeft_backup_box")
        .eq("partner_id", partnerId);
      const prodList = (producten || []) as any[];

      // Verzamel component-targets per regel
      const assemblageIds = prodList.filter((p) => p.is_assemblage).map((p) => p.id);
      let compMap: Record<string, Array<{ component_id: string; aantal: number; naam: string; merk: string | null; heeft_sn: boolean }>> = {};
      if (assemblageIds.length) {
        const { data: comps } = await supabase
          .from("product_componenten" as any)
          .select("assemblage_id, component_id, aantal, component:producten!product_componenten_component_id_fkey(id, naam, merk, heeft_serienummer, omvormer_modulair, heeft_backup_box)")
          .in("assemblage_id", assemblageIds);
        (comps || []).forEach((c: any) => {
          const arr = compMap[c.assemblage_id] ?? [];
          const heeftSn = !!(c.component?.heeft_serienummer || c.component?.omvormer_modulair || c.component?.heeft_backup_box);
          arr.push({
            component_id: c.component_id,
            aantal: Number(c.aantal || 0),
            naam: c.component?.naam ?? "Onbekend",
            merk: c.component?.merk ?? null,
            heeft_sn: heeftSn,
          });
          compMap[c.assemblage_id] = arr;
        });
      }

      const targets: SNTarget[] = [];
      regels.forEach((r, i) => {
        // 1) Directe product_id-koppeling (verkoopregel bewaart product_id).
        let p = r.product_id ? prodList.find((x) => x.id === r.product_id) : undefined;
        // 2) Fallback: matchen op omschrijving/artikelnummer/EAN.
        if (!p) {
          const prod = matchProductOpRegel(r.omschrijving, prodList);
          if (prod) p = prodList.find((x) => x.id === prod.id);
        }
        if (!p) return;
        if (p.is_assemblage) {
          const comps = compMap[p.id] || [];
          const compsMetSn = comps.filter((c) => c.heeft_sn);
          if (compsMetSn.length === 0) return;
          compsMetSn.forEach((c) => {
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
        } else if (p.heeft_serienummer || p.omvormer_modulair || p.heeft_backup_box) {
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
      const { data: authData } = await supabase.auth.getUser();
      const actorId = authData?.user?.id ?? null;
      const logRows: Array<{
        partner_id: string;
        serienummer_id: string;
        serienummer: string;
        product_id: string;
        opdracht_id: string | null;
        actie: "toegewezen" | "teruggezet" | "handmatig_toegevoegd";
        oude_status: string | null;
        nieuwe_status: string | null;
        actor_id: string | null;
      }> = [];

      // Bepaal welke ID's blijven (om te weten wat terug naar voorraad moet)
      const behouden = new Set(assignments.map((a) => a.existing_id).filter(Boolean) as string[]);

      // 1. Reset huidige toewijzing die niet meer voorkomt in nieuwe selectie
      const { data: huidig } = await supabase
        .from("product_serienummers" as any)
        .select("id, product_id, serienummer, status")
        .eq("opdracht_id", opdrachtId)
        .eq("status", "gereserveerd");
      const teResetten = ((huidig || []) as any[]).filter((r) => !behouden.has(r.id));
      if (teResetten.length) {
        const ids = teResetten.map((r) => r.id);
        const { error: resErr } = await supabase
          .from("product_serienummers" as any)
          .update({ opdracht_id: null, status: "voorraad" })
          .in("id", ids);
        if (resErr) throw resErr;
        teResetten.forEach((r) => {
          logRows.push({
            partner_id: partnerId,
            serienummer_id: r.id,
            serienummer: r.serienummer,
            product_id: r.product_id,
            opdracht_id: opdrachtId,
            actie: "teruggezet",
            oude_status: "gereserveerd",
            nieuwe_status: "voorraad",
            actor_id: actorId,
          });
        });
      }

      // 2. Verwerk nieuwe toewijzing
      for (const a of assignments) {
        if (a.existing_id) {
          const { data: vorige } = await supabase
            .from("product_serienummers" as any)
            .select("id, serienummer, status, opdracht_id")
            .eq("id", a.existing_id)
            .maybeSingle();
          const v = vorige as any;
          if (v?.opdracht_id === opdrachtId && v?.status === "gereserveerd") continue; // niks veranderd
          const { error } = await supabase
            .from("product_serienummers" as any)
            .update({ opdracht_id: opdrachtId, status: "gereserveerd" })
            .eq("id", a.existing_id);
          if (error) throw error;
          logRows.push({
            partner_id: partnerId,
            serienummer_id: a.existing_id,
            serienummer: v?.serienummer ?? "",
            product_id: a.product_id,
            opdracht_id: opdrachtId,
            actie: "toegewezen",
            oude_status: v?.status ?? null,
            nieuwe_status: "gereserveerd",
            actor_id: actorId,
          });
        } else {
          if (!a.serienummer.trim()) continue;
          const { data: bestaand } = await supabase
            .from("product_serienummers" as any)
            .select("id, opdracht_id, status")
            .eq("partner_id", partnerId)
            .eq("product_id", a.product_id)
            .eq("serienummer", a.serienummer.trim())
            .maybeSingle();
          if (bestaand) {
            const b = bestaand as any;
            const { error } = await supabase
              .from("product_serienummers" as any)
              .update({ opdracht_id: opdrachtId, status: "gereserveerd" })
              .eq("id", b.id);
            if (error) throw error;
            logRows.push({
              partner_id: partnerId,
              serienummer_id: b.id,
              serienummer: a.serienummer.trim(),
              product_id: a.product_id,
              opdracht_id: opdrachtId,
              actie: "toegewezen",
              oude_status: b.status ?? null,
              nieuwe_status: "gereserveerd",
              actor_id: actorId,
            });
          } else {
            const { data: nieuw, error } = await supabase
              .from("product_serienummers" as any)
              .insert({
                partner_id: partnerId,
                product_id: a.product_id,
                serienummer: a.serienummer.trim(),
                opdracht_id: opdrachtId,
                status: "gereserveerd",
              })
              .select("id")
              .single();
            if (error) throw error;
            logRows.push({
              partner_id: partnerId,
              serienummer_id: (nieuw as any).id,
              serienummer: a.serienummer.trim(),
              product_id: a.product_id,
              opdracht_id: opdrachtId,
              actie: "handmatig_toegevoegd",
              oude_status: null,
              nieuwe_status: "gereserveerd",
              actor_id: actorId,
            });
          }
        }
      }

      if (logRows.length) {
        await supabase.from("serienummer_toewijzing_log" as any).insert(logRows);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sn-toewijzing", opdrachtId] });
      qc.invalidateQueries({ queryKey: ["serienummers-klant"] });
      qc.invalidateQueries({ queryKey: ["serienummers-installatie"] });
      qc.invalidateQueries({ queryKey: ["sn-toewijzing-log", opdrachtId] });
    },
  });
};

export interface SNLogEntry {
  id: string;
  serienummer: string;
  serienummer_id: string;
  product_id: string;
  opdracht_id: string | null;
  actie: "toegewezen" | "teruggezet" | "handmatig_toegevoegd";
  oude_status: string | null;
  nieuwe_status: string | null;
  actor_id: string | null;
  actor_naam?: string;
  product_naam?: string;
  created_at: string;
}

export const useSNToewijzingLog = (opdrachtId?: string | null) => {
  return useQuery({
    queryKey: ["sn-toewijzing-log", opdrachtId],
    enabled: !!opdrachtId,
    queryFn: async (): Promise<SNLogEntry[]> => {
      const { data, error } = await supabase
        .from("serienummer_toewijzing_log" as any)
        .select("id, serienummer, serienummer_id, product_id, opdracht_id, actie, oude_status, nieuwe_status, actor_id, created_at")
        .eq("opdracht_id", opdrachtId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data || []) as any[];
      const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)));
      const prodIds = Array.from(new Set(rows.map((r) => r.product_id).filter(Boolean)));
      const nameMap = new Map<string, string>();
      const prodMap = new Map<string, string>();
      if (actorIds.length) {
        const { data: u } = await supabase
          .from("users")
          .select("id, voornaam, achternaam")
          .in("id", actorIds);
        (u || []).forEach((x: any) => nameMap.set(x.id, `${x.voornaam ?? ""} ${x.achternaam ?? ""}`.trim() || "Systeem"));
      }
      if (prodIds.length) {
        const { data: p } = await supabase
          .from("producten")
          .select("id, naam, merk")
          .in("id", prodIds);
        (p || []).forEach((x: any) => prodMap.set(x.id, [x.merk, x.naam].filter(Boolean).join(" ")));
      }
      return rows.map((r) => ({
        ...r,
        actor_naam: r.actor_id ? nameMap.get(r.actor_id) : undefined,
        product_naam: prodMap.get(r.product_id),
      }));
    },
  });
};