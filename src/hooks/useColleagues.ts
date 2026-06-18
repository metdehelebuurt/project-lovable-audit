import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Colleague {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  rol: string;
  avatar_url: string | null;
}

/**
 * Haalt actieve collega's binnen dezelfde partner op (excl. de huidige gebruiker).
 * Gebruikt voor @mention popovers in notities.
 */
export function useColleagues(partnerId: string | null | undefined, currentUserId?: string | null) {
  return useQuery({
    queryKey: ["colleagues", partnerId, currentUserId],
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Colleague[]> => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, email, rol, avatar_url, status")
        .eq("partner_id", partnerId)
        .eq("status", "actief")
        .order("voornaam", { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .filter((u: any) => u.id !== currentUserId)
        .map((u: any) => ({
          id: u.id,
          voornaam: u.voornaam ?? "",
          achternaam: u.achternaam ?? "",
          email: u.email ?? "",
          rol: u.rol ?? "",
          avatar_url: u.avatar_url ?? null,
        }));
    },
  });
}