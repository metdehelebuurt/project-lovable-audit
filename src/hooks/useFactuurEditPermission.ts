import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Bepaalt of de huidige gebruiker een reeds verzonden factuur/creditnota
 * mag bewerken. Toegestaan voor:
 *  - superadmin
 *  - partner_admin
 *  - gebruikers met expliciete permissie `kan_facturen_bewerken_na_versturen`
 *
 * Concept-facturen mogen altijd bewerkt worden door iedereen met toegang.
 */
export function useFactuurEditPermission() {
  const { profile, user } = useAuth();
  const rol = profile?.rol;
  const isAdmin = rol === "superadmin" || rol === "partner_admin";

  const { data: permissies } = useQuery({
    queryKey: ["gebruiker-permissies", user?.id],
    enabled: !!user?.id && !isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gebruiker_permissies")
        .select("permissies")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.permissies as Record<string, boolean> | null) ?? {};
    },
  });

  const heeftExtraPermissie = !!permissies?.kan_facturen_bewerken_na_versturen;

  return {
    /** Mag de gebruiker een reeds verzonden factuur openen om te bewerken. */
    kanBewerkenNaVersturen: isAdmin || heeftExtraPermissie,
    /** Toon waarschuwing in plaats van blokkade — admin krijgt geen "via permissie"-tekst. */
    isAdmin,
  };
}

export default useFactuurEditPermission;