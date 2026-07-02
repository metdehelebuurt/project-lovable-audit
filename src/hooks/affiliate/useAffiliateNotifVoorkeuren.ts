import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AffiliateNotifVoorkeur {
  id?: string;
  user_id: string;
  categorie: string;
  in_app: boolean;
  email: boolean;
  browser: boolean;
  stiltijd_van: string | null;
  stiltijd_tot: string | null;
  temperaturen: string[];
}

const KEY = ["affiliate-notif-voorkeuren"] as const;

export function useAffiliateNotifVoorkeuren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Record<string, AffiliateNotifVoorkeur>> => {
      const { data, error } = await supabase
        .from("affiliate_notificatie_voorkeuren")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: Record<string, AffiliateNotifVoorkeur> = {};
      for (const r of (data ?? []) as AffiliateNotifVoorkeur[]) map[r.categorie] = r;
      return map;
    },
  });
}

export function useUpsertAffiliateNotifVoorkeur() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: Omit<AffiliateNotifVoorkeur, "user_id" | "id">) => {
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("affiliate_notificatie_voorkeuren")
        .upsert(
          { ...v, user_id: user.id },
          { onConflict: "user_id,categorie" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}