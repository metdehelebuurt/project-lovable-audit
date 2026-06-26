import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Telt ongelezen notificaties per module (entity_type) voor de huidige gebruiker.
 * Wordt gebruikt om rode badges in de sidebar te tonen.
 */
export function useModuleNotificatieCounts() {
  const { user } = useAuth();

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
 * Markeer één specifieke notificatie als gelezen.
 */
export async function markeerNotificatieGelezen(notificatieId: string) {
  await supabase
    .from("notificaties")
    .update({ gelezen: true })
    .eq("id", notificatieId);
}

export interface ModuleNotificatie {
  id: string;
  titel: string;
  bericht: string | null;
  type: string | null;
  entity_id: string | null;
  entity_type: string | null;
  created_at: string;
}

/**
 * Haalt de ongelezen notificaties op voor een specifieke entity_type (module).
 * Wordt gebruikt in de popover op een module-badge zodat de gebruiker direct
 * ziet over welke items de notificaties gaan.
 */
export function useModuleNotificaties(entityType: string | null, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["module-notificaties", user?.id, entityType],
    enabled: !!user && !!entityType && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaties")
        .select("id, titel, bericht, type, entity_id, entity_type, created_at")
        .eq("user_id", user!.id)
        .eq("entity_type", entityType!)
        .eq("gelezen", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ModuleNotificatie[];
    },
  });
}

/**
 * Mapping van entity_type → detail-URL voor een specifiek item.
 */
export function detailUrlVoorEntiteit(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "leads": return `/leads/${entityId}`;
    case "offertes": return `/offertes/${entityId}`;
    case "schouwen": return `/schouwen/${entityId}`;
    case "installaties": return `/installaties/${entityId}`;
    case "opdrachten": return `/opdrachten/${entityId}`;
    case "helpdesk_tickets": return `/helpdesk/${entityId}`;
    case "financiele_documenten": return `/financieel/${entityId}`;
    case "feedback_verzoeken": return `/feedback`;
    case "afspraken": return `/planning`;
    case "email_berichten": return `/berichten`;
    default: return null;
  }
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