import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DuplicaatPaar, LeadLite } from "./types";

export type DuplicaatPaarMetLeads = DuplicaatPaar & {
  lead_a: LeadLite | null;
  lead_b: LeadLite | null;
};

const LEAD_COLS = "id, partner_id, voornaam, achternaam, email, telefoon, bedrijfsnaam, adres, postcode, plaats, lead_status, bron, notities, owner_user_id, toegewezen_aan, created_at";

export function useDuplicaten() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["lead-duplicaten", profile?.partner_id],
    enabled: !!profile?.partner_id,
    queryFn: async (): Promise<DuplicaatPaarMetLeads[]> => {
      const { data: paren, error } = await supabase
        .from("v_lead_duplicaten" as never)
        .select("*")
        .order("score", { ascending: false });
      if (error) throw error;
      const list = (paren ?? []) as unknown as DuplicaatPaar[];
      if (list.length === 0) return [];

      const ids = Array.from(new Set(list.flatMap((p) => [p.lead_a_id, p.lead_b_id])));
      const { data: leads, error: leadErr } = await supabase
        .from("leads")
        .select(LEAD_COLS)
        .in("id", ids);
      if (leadErr) throw leadErr;
      const byId = new Map<string, LeadLite>(((leads ?? []) as unknown as LeadLite[]).map((l) => [l.id, l]));

      return list
        .map((p) => ({ ...p, lead_a: byId.get(p.lead_a_id) ?? null, lead_b: byId.get(p.lead_b_id) ?? null }))
        .filter((p) => p.lead_a && p.lead_b);
    },
  });
}

/** Hook die paren ophaalt waar deze specifieke lead bij betrokken is. */
export function useDuplicatenVoorLead(leadId: string | undefined) {
  const all = useDuplicaten();
  const data = all.data?.filter((p) => p.lead_a_id === leadId || p.lead_b_id === leadId) ?? [];
  return { ...all, data };
}