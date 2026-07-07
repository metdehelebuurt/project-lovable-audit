import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RepStats {
  eigenaar_id: string | null;
  naam: string;
  totaal: number;
  waarde: number;
  heet: number;
  stil7d: number;
  nextActieTeLaat: number;
  activiteit7d: number;
  gewonnen30d: number;
  verloren30d: number;
  conversie30d: number;
}

export function useTeamStats() {
  const leadsQ = useQuery({
    queryKey: ["team-stats", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("id, eigenaar_id, fase_slug, temperatuur, geschatte_waarde, updated_at, volgende_actie_op, verloren_op")
        .limit(3000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const logsQ = useQuery({
    queryKey: ["team-stats", "logs"],
    queryFn: async () => {
      const grens = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await supabase
        .from("affiliate_opvolg_log")
        .select("affiliate_id, created_at")
        .gte("created_at", grens)
        .limit(3000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const usersQ = useQuery({
    queryKey: ["team-stats", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam")
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo<RepStats[]>(() => {
    const leads = leadsQ.data ?? [];
    const logs = logsQ.data ?? [];
    const users = usersQ.data ?? [];
    const nameMap = new Map(users.map((u) => [u.id, `${u.voornaam ?? ""} ${u.achternaam ?? ""}`.trim() || "Onbekend"]));
    const nu = Date.now();
    const grens7d = nu - 7 * 86400000;
    const grens30d = nu - 30 * 86400000;
    const map = new Map<string, RepStats>();
    const getKey = (id: string | null) => id ?? "__platform__";

    for (const l of leads) {
      const key = getKey(l.eigenaar_id);
      const s = map.get(key) ?? {
        eigenaar_id: l.eigenaar_id ?? null,
        naam: l.eigenaar_id ? (nameMap.get(l.eigenaar_id) ?? "Onbekend") : "Platform (ongewezen)",
        totaal: 0, waarde: 0, heet: 0, stil7d: 0, nextActieTeLaat: 0,
        activiteit7d: 0, gewonnen30d: 0, verloren30d: 0, conversie30d: 0,
      };
      s.totaal += 1;
      s.waarde += Number(l.geschatte_waarde ?? 0);
      if (l.temperatuur === "heet" || l.temperatuur === "warm") s.heet += 1;
      if (l.updated_at && new Date(l.updated_at).getTime() < grens7d) s.stil7d += 1;
      if (l.volgende_actie_op && new Date(l.volgende_actie_op).getTime() < nu) s.nextActieTeLaat += 1;
      if (l.fase_slug === "gewonnen" && l.updated_at && new Date(l.updated_at).getTime() >= grens30d) s.gewonnen30d += 1;
      if (l.fase_slug === "verloren" && l.verloren_op && new Date(l.verloren_op).getTime() >= grens30d) s.verloren30d += 1;
      map.set(key, s);
    }
    for (const log of logs) {
      const key = getKey(log.affiliate_id ?? null);
      const s = map.get(key);
      if (s) s.activiteit7d += 1;
    }
    for (const s of map.values()) {
      const afgerond = s.gewonnen30d + s.verloren30d;
      s.conversie30d = afgerond > 0 ? Math.round((s.gewonnen30d / afgerond) * 100) : 0;
    }
    return Array.from(map.values()).sort((a, b) => b.waarde - a.waarde);
  }, [leadsQ.data, logsQ.data, usersQ.data]);

  return { stats, isLoading: leadsQ.isLoading || logsQ.isLoading || usersQ.isLoading };
}