import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SalesTrialAffiliate {
  affiliate_id: string;
  commissie_percentage: number | null;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
}

export interface SalesTrialPartner {
  id: string;
  naam: string;
  email: string | null;
  telefoonnummer: string | null;
  contactpersoon_voornaam: string | null;
  contactpersoon_achternaam: string | null;
  contactpersoon_email: string | null;
  contactpersoon_telefoon: string | null;
  contactpersoon_functie: string | null;
  plaats: string | null;
  postcode: string | null;
  adres: string | null;
  website: string | null;
  kvk: string | null;
  status: string | null;
  trial_einddatum: string | null;
  created_at: string;
  trial_bron: "selfservice" | "affiliate" | "sales" | "google_oauth" | null;
  trial_aangemaakt_op: string | null;
  affiliate: SalesTrialAffiliate | null;
}

/** Alle trials (lopend en tot 30 dagen verlopen) voor sales manager/admin. */
export function useSalesTrials() {
  return useQuery({
    queryKey: ["sales-trials"],
    staleTime: 60_000,
    queryFn: async (): Promise<SalesTrialPartner[]> => {
      const { data, error } = await supabase.functions.invoke("sales-manager-trials", {
        body: {},
      });
      if (error) throw error;
      const raw = (data as { trials?: SalesTrialPartner[] } | null)?.trials ?? [];
      return raw;
    },
  });
}

export interface PartnerUpsellInfo {
  partner_id: string;
  heeft_smartaccu: boolean;
}

/** Bepaalt per partner of de Smartaccu-addon nog niet is aangeschaft. */
export function usePartnerUpsells(partnerIds: string[]) {
  const key = [...partnerIds].sort().join(",");
  return useQuery({
    queryKey: ["sales-partner-upsells", key],
    enabled: partnerIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, PartnerUpsellInfo>> => {
      const { data, error } = await supabase
        .from("abonnement_addon_aankopen")
        .select("partner_id, status, addon:addon_id(slug)")
        .in("partner_id", partnerIds)
        .in("status", ["actief", "trial", "in_proef"]);
      if (error) throw error;
      const map: Record<string, PartnerUpsellInfo> = {};
      for (const pid of partnerIds) map[pid] = { partner_id: pid, heeft_smartaccu: false };
      for (const row of (data ?? []) as Array<{
        partner_id: string;
        addon: { slug: string | null } | null;
      }>) {
        const slug = row.addon?.slug?.toLowerCase() ?? "";
        if (slug.includes("accu") || slug.includes("smartaccu")) {
          map[row.partner_id] = { partner_id: row.partner_id, heeft_smartaccu: true };
        }
      }
      return map;
    },
  });
}