import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InterneCollega {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
  rol: string | null;
}

const TOEGESTANE_ROLLEN = ["partner_admin", "partner_staff", "adviseur", "affiliate"] as const;

export function useInterneCollegas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["interne-collegas", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<InterneCollega[]> => {
      const { data: me, error: meErr } = await supabase
        .from("users")
        .select("partner_id")
        .eq("id", user!.id)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!me?.partner_id) return [];

      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, email, rol, status")
        .eq("partner_id", me.partner_id)
        .in("rol", TOEGESTANE_ROLLEN as unknown as string[])
        .order("voornaam", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter((u: any) => u.status !== "inactief");
    },
  });
}