import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateMetAgenda } from "./useAffiliatesMetAgenda";

export interface AffiliateDetails extends AffiliateMetAgenda {
  partner_naam: string | null;
  aantal_leads: number;
  aantal_open_afspraken: number;
  laatste_activiteit: string | null;
}

/** Verrijkt de affiliate-lijst met partnernaam en wat lead-/afspraak-statistieken. */
export function useAffiliatesMetDetails() {
  return useQuery({
    queryKey: ["sales", "affiliates", "details"],
    queryFn: async (): Promise<AffiliateDetails[]> => {
      const { data: basis, error: basisErr } = await supabase.rpc("lijst_affiliates_voor_sales_admin");
      if (basisErr) throw basisErr;
      const rijen = (basis ?? []) as AffiliateMetAgenda[];
      if (rijen.length === 0) return [];

      const partnerIds = [...new Set(rijen.map((r) => r.partner_id).filter(Boolean))] as string[];
      const userIds = rijen.map((r) => r.id);

      const [partners, leadsCount, afspraken] = await Promise.all([
        partnerIds.length > 0
          ? supabase.from("partners").select("id, naam").in("id", partnerIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("affiliate_leads")
          .select("eigenaar_id, updated_at")
          .in("eigenaar_id", userIds),
        supabase
          .from("affiliate_terugbel_afspraken")
          .select("affiliate_id, geplande_op, afgehandeld_op")
          .in("affiliate_id", userIds)
          .gte("geplande_op", new Date().toISOString())
          .is("afgehandeld_op", null),
      ]);

      const partnerMap = new Map<string, string>();
      (partners.data ?? []).forEach((p: { id: string; naam: string }) => partnerMap.set(p.id, p.naam));

      const leadCount = new Map<string, number>();
      const laatste = new Map<string, string>();
      (leadsCount.data ?? []).forEach((l: { eigenaar_id: string | null; updated_at: string | null }) => {
        if (!l.eigenaar_id) return;
        leadCount.set(l.eigenaar_id, (leadCount.get(l.eigenaar_id) ?? 0) + 1);
        const huidig = laatste.get(l.eigenaar_id);
        if (l.updated_at && (!huidig || l.updated_at > huidig)) laatste.set(l.eigenaar_id, l.updated_at);
      });

      const openAfspraken = new Map<string, number>();
      (afspraken.data ?? []).forEach((a: { affiliate_id: string }) => {
        openAfspraken.set(a.affiliate_id, (openAfspraken.get(a.affiliate_id) ?? 0) + 1);
      });

      return rijen.map((r) => ({
        ...r,
        partner_naam: r.partner_id ? partnerMap.get(r.partner_id) ?? null : null,
        aantal_leads: leadCount.get(r.id) ?? 0,
        aantal_open_afspraken: openAfspraken.get(r.id) ?? 0,
        laatste_activiteit: laatste.get(r.id) ?? null,
      }));
    },
    staleTime: 60_000,
  });
}