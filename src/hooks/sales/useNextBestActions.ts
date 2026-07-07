import { useMemo } from "react";
import { useSalesLeads, type SalesLead } from "@/hooks/sales/useSalesLeads";

export interface NextBestAction {
  lead: SalesLead;
  reden: string;
  impact: number;
}

export function useNextBestActions(limit = 10) {
  const { data: leads, isLoading } = useSalesLeads();

  const acties = useMemo<NextBestAction[]>(() => {
    const nu = Date.now();
    const out: NextBestAction[] = [];
    for (const l of leads ?? []) {
      if (l.fase_slug === "gewonnen" || l.fase_slug === "verloren") continue;
      const waarde = Number(l.geschatte_waarde ?? 0);
      let urgentie = 0;
      const redenen: string[] = [];
      if (l.volgende_actie_op && new Date(l.volgende_actie_op).getTime() < nu) {
        urgentie += 100;
        redenen.push("volgende actie is verstreken");
      }
      if (l.temperatuur === "heet") { urgentie += 40; redenen.push("heet"); }
      else if (l.temperatuur === "warm") { urgentie += 15; }
      const dagenStil = l.updated_at ? Math.floor((nu - new Date(l.updated_at).getTime()) / 86400000) : 0;
      if (dagenStil > 21) { urgentie += 40; redenen.push(`${dagenStil}d stil`); }
      else if (dagenStil > 14) { urgentie += 20; redenen.push(`${dagenStil}d stil`); }
      if (l.risico_score === "rood") { urgentie += 60; redenen.push("hoog risico"); }
      else if (l.risico_score === "oranje") { urgentie += 25; }
      if (urgentie === 0) continue;
      const impact = urgentie * Math.log10(Math.max(waarde, 1) + 10);
      out.push({ lead: l, reden: redenen.join(" · ") || "opvolging vereist", impact });
    }
    return out.sort((a, b) => b.impact - a.impact).slice(0, limit);
  }, [leads, limit]);

  return { acties, isLoading };
}