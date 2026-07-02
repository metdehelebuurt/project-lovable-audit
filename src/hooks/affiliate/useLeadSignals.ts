import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export interface LeadSignal {
  lead_id: string;
  ongelezen_mails: number;
  ongelezen_opmerkingen: number;
  openstaande_taken: number;
  aankomende_terugbel: number;
  laatste_signaal: string | null;
}

const KEY = ["affiliate-lead-signals"] as const;

/**
 * Ongelezen signalen (mails, taken, terugbelafspraken) per lead voor de ingelogde affiliate.
 * Realtime-invalidatie op mail/notificatie triggers.
 */
export function useAffiliateLeadSignals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Record<string, LeadSignal>> => {
      const { data, error } = await supabase.rpc("affiliate_lead_signals", { _user_id: user!.id });
      if (error) throw error;
      const map: Record<string, LeadSignal> = {};
      for (const row of (data ?? []) as LeadSignal[]) map[row.lead_id] = row;
      return map;
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`lead-signals:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaties", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: KEY }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  return query;
}

export async function markeerLeadBekeken(leadId: string) {
  await supabase.rpc("affiliate_lead_markeer_bekeken", { _lead_id: leadId });
}

export function totaalSignalen(s: LeadSignal | undefined): number {
  if (!s) return 0;
  return (s.ongelezen_mails ?? 0) + (s.openstaande_taken ?? 0) + (s.aankomende_terugbel ?? 0) + (s.ongelezen_opmerkingen ?? 0);
}