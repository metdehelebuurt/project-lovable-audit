import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DemoAfspraakRow {
  id: string;
  lead_id: string;
  affiliate_id: string;
  collega_user_id: string | null;
  geplande_op: string;
  notitie: string | null;
  afgehandeld_op: string | null;
  noshow: boolean | null;
  reminder_24u_op: string | null;
  reminder_1u_op: string | null;
  reminder_24u_actief: boolean;
  reminder_1u_actief: boolean;
  reminder_24u_gepland_op: string | null;
  reminder_1u_gepland_op: string | null;
  affiliate_leads: {
    bedrijfsnaam: string | null;
    contactpersoon: string | null;
    telefoon: string | null;
    email: string | null;
  } | null;
  eigenaar: {
    id: string;
    voornaam: string | null;
    achternaam: string | null;
    email: string | null;
  } | null;
}

/**
 * Alle demo-afspraken over alle affiliates heen — bedoeld voor sales managers/superadmins.
 * RLS regelt de toegang; onbevoegde rollen krijgen een lege set terug.
 */
export function useAlleDemoAfspraken(scope: "open" | "alle" = "open") {
  return useQuery({
    queryKey: ["alle-demo-afspraken", scope],
    queryFn: async (): Promise<DemoAfspraakRow[]> => {
      let q = supabase
        .from("affiliate_terugbel_afspraken")
        .select(
          `id, lead_id, affiliate_id, collega_user_id, geplande_op, notitie, afgehandeld_op, noshow,
           reminder_24u_op, reminder_1u_op, reminder_24u_actief, reminder_1u_actief,
           reminder_24u_gepland_op, reminder_1u_gepland_op,
           affiliate_leads:lead_id (bedrijfsnaam, contactpersoon, telefoon, email),
           eigenaar:affiliate_id (id, voornaam, achternaam, email)`,
        )
        .eq("type", "demo")
        .order("geplande_op", { ascending: true });
      if (scope === "open") q = q.is("afgehandeld_op", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as DemoAfspraakRow[];
    },
  });
}