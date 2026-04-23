import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Installatie } from "@/components/installaties/api/installatieApi";

export type SchouwBron = "direct" | "opdracht" | "voorstel" | "geen";

export interface SchouwResolver {
  schouw: Record<string, unknown> | null;
  bron: SchouwBron;
}

/**
 * Resolved schouw voor een installatie. Prioriteit:
 * 1. installatie.schouw_id (direct gekoppeld)
 * 2. opdracht.schouw_id (via gekoppelde opdracht)
 * 3. meest recente uitgevoerde schouw met dezelfde lead binnen partner (voorstel)
 */
export function useInstallatieSchouw(installatie: Installatie | null | undefined) {
  const directId = (installatie as unknown as { schouw_id?: string | null } | null)?.schouw_id ?? null;
  return useQuery<SchouwResolver>({
    queryKey: ["installatie-schouw", installatie?.id, directId, installatie?.opdracht_id, installatie?.lead_id],
    enabled: !!installatie?.id,
    queryFn: async () => {
      if (!installatie) return { schouw: null, bron: "geen" };

      // 1. Direct
      if (directId) {
        const { data } = await supabase.from("schouwen").select("*").eq("id", directId).maybeSingle();
        if (data) return { schouw: data as Record<string, unknown>, bron: "direct" };
      }

      // 2. Via opdracht
      if (installatie.opdracht_id) {
        const { data: opd } = await supabase
          .from("opdrachten")
          .select("schouw_id")
          .eq("id", installatie.opdracht_id)
          .maybeSingle();
        if (opd?.schouw_id) {
          const { data } = await supabase.from("schouwen").select("*").eq("id", opd.schouw_id).maybeSingle();
          if (data) return { schouw: data as Record<string, unknown>, bron: "opdracht" };
        }
      }

      // 3. Voorstel via lead
      if (installatie.lead_id && installatie.partner_id) {
        const { data } = await supabase
          .from("schouwen")
          .select("*")
          .eq("lead_id", installatie.lead_id)
          .eq("partner_id", installatie.partner_id)
          .eq("status", "uitgevoerd")
          .order("geplande_datum", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) return { schouw: data as Record<string, unknown>, bron: "voorstel" };
      }

      return { schouw: null, bron: "geen" };
    },
  });
}