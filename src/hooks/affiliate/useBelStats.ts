import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BelStats = {
  vandaagGebeld: number;
  vandaagGewonnen: number;
  vandaagAfspraken: number;
  gemDuurSeconden: number;
  conversieRatio: number;
};

/** Statistieken voor de belwerkbank: alleen voor vandaag, alleen voor ingelogde affiliate. */
export function useBelStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-bel-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<BelStats> => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("affiliate_lead_contactmomenten")
        .select("type, uitkomst, duur_seconden")
        .eq("affiliate_id", user!.id)
        .gte("created_at", start.toISOString());
      if (error) throw error;
      const rows = data ?? [];
      const telefoon = rows.filter((r) => r.type === "telefoon");
      const totaalDuur = telefoon.reduce((s, r) => s + (r.duur_seconden ?? 0), 0);
      const gewonnen = rows.filter((r) => /gewonnen|trial/i.test(r.uitkomst ?? "")).length;
      const afspraken = rows.filter((r) => /afspraak|gepland/i.test(r.uitkomst ?? "")).length;
      return {
        vandaagGebeld: telefoon.length,
        vandaagGewonnen: gewonnen,
        vandaagAfspraken: afspraken,
        gemDuurSeconden: telefoon.length ? Math.round(totaalDuur / telefoon.length) : 0,
        conversieRatio: telefoon.length ? Math.round(((gewonnen + afspraken) / telefoon.length) * 100) : 0,
      };
    },
  });
}