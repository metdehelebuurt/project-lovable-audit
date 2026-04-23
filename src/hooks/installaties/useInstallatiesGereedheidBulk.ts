import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BulkGereedheid {
  totaal: number;
  ok: number;
  blokkades: number;
}

export type BulkGereedheidMap = Record<string, BulkGereedheid>;

/**
 * Lichtgewicht batch-variant van useInstallatieGereedheid voor het overzichtsscherm.
 * Haalt in één query de checklist-items op + leidt schouw/klant/monteur/producten
 * af uit de installatie-rij zelf. Geen voorraad-RPC's per rij.
 */
export function useInstallatiesGereedheidBulk(installatieIds: string[]) {
  const stableKey = [...installatieIds].sort().join(",");
  return useQuery({
    queryKey: ["installaties-gereedheid-bulk", stableKey],
    enabled: installatieIds.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<BulkGereedheidMap> => {
      const result: BulkGereedheidMap = {};

      const { data: installaties, error: instErr } = await supabase
        .from("installaties")
        .select("id, opdracht_id, installateur_id, bevestiging_verzonden_op, monteur_geaccepteerd_op, werkadres, klant_postcode, klant_plaats, geplande_startdatum, werkomschrijving, producten")
        .in("id", installatieIds);
      if (instErr) throw instErr;

      const opdrachtIds = (installaties ?? [])
        .map((i) => i.opdracht_id)
        .filter((x): x is string => !!x);

      const opdrachtMap = new Map<string, string | null>();
      if (opdrachtIds.length > 0) {
        const { data: opdrachten } = await supabase
          .from("opdrachten")
          .select("id, schouw_id")
          .in("id", opdrachtIds);
        for (const o of opdrachten ?? []) opdrachtMap.set(o.id, o.schouw_id);
      }

      const schouwIds = Array.from(opdrachtMap.values()).filter((x): x is string => !!x);
      const schouwStatusMap = new Map<string, string>();
      if (schouwIds.length > 0) {
        const { data: schouwen } = await supabase
          .from("schouwen")
          .select("id, status")
          .in("id", schouwIds);
        for (const s of schouwen ?? []) schouwStatusMap.set(s.id, s.status as string);
      }

      const { data: checklist } = await supabase
        .from("installatie_checklist_items")
        .select("installatie_id, blokkerend, voltooid_op")
        .in("installatie_id", installatieIds);

      const clMap = new Map<string, { totaal: number; ok: number; blok: number }>();
      for (const c of checklist ?? []) {
        const cur = clMap.get(c.installatie_id) ?? { totaal: 0, ok: 0, blok: 0 };
        cur.totaal += 1;
        if (c.voltooid_op) cur.ok += 1;
        else if (c.blokkerend) cur.blok += 1;
        clMap.set(c.installatie_id, cur);
      }

      for (const inst of installaties ?? []) {
        let totaal = 0;
        let ok = 0;
        let blokkades = 0;

        // Schouw
        const schouwId = inst.opdracht_id ? opdrachtMap.get(inst.opdracht_id) : null;
        const schouwOk = !!schouwId && schouwStatusMap.get(schouwId) === "uitgevoerd";
        totaal += 1;
        if (schouwOk) ok += 1;
        else blokkades += 1;

        // Klant bevestigd
        totaal += 1;
        if (inst.bevestiging_verzonden_op && inst.monteur_geaccepteerd_op) ok += 1;

        // Monteur
        totaal += 1;
        if (inst.installateur_id) ok += 1;
        else blokkades += 1;

        // Werkadres
        totaal += 1;
        if (inst.werkadres && inst.klant_postcode && inst.klant_plaats) ok += 1;

        // Producten
        const producten = Array.isArray(inst.producten) ? inst.producten : [];
        totaal += 1;
        if (producten.length > 0) ok += 1;
        else blokkades += 1;

        // Planning
        totaal += 1;
        if (inst.geplande_startdatum && inst.werkomschrijving) ok += 1;

        // Checklist
        const cl = clMap.get(inst.id);
        if (cl) {
          totaal += cl.totaal;
          ok += cl.ok;
          blokkades += cl.blok;
        }

        result[inst.id] = { totaal, ok, blokkades };
      }

      return result;
    },
  });
}