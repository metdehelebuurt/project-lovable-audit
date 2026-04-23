import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Telt ongelezen notificaties per module (entity_type) voor de huidige gebruiker.
 * Wordt gebruikt om rode badges in de sidebar te tonen.
 */
export function useModuleNotificatieCounts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["module-notificatie-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaties")
        .select("entity_type")
        .eq("user_id", user!.id)
        .eq("gelezen", false);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const key = (row as { entity_type: string | null }).entity_type ?? "overig";
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return counts;
    },
    refetchInterval: 60000,
  });

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("module-notificatie-counts")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notificaties", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["module-notificatie-counts"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
}

/**
 * Markeer alle notificaties van een bepaalde entity_type als gelezen.
 */
export async function markeerModuleGelezen(userId: string, entityType: string) {
  await supabase
    .from("notificaties")
    .update({ gelezen: true })
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("gelezen", false);
}

/**
 * Mapping van URL → entity_type, zodat we ongelezen tellers kunnen koppelen aan menu-items.
 */
export function entityTypeForUrl(url: string): string | null {
  if (url.startsWith("/leads")) return "leads";
  if (url.startsWith("/offertes")) return "offertes";
  if (url.startsWith("/installaties")) return "installaties";
  if (url.startsWith("/schouwen")) return "schouwen";
  if (url.startsWith("/opdrachten")) return "opdrachten";
  if (url.startsWith("/helpdesk")) return "helpdesk_tickets";
  if (url.startsWith("/financieel")) return "financiele_documenten";
  if (url.startsWith("/berichten")) return "email_berichten";
  return null;
}