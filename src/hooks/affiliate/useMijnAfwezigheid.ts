import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MijnAfwezigheid {
  id: string;
  van: string;
  tot: string;
  reden: string | null;
}

const KEY = ["mijn-afwezigheid"] as const;

export function useMijnAfwezigheid() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MijnAfwezigheid[]> => {
      const { data, error } = await supabase
        .from("gebruiker_afwezigheid")
        .select("id, van, tot, reden")
        .eq("user_id", user!.id)
        .order("van", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVoegMijnAfwezigheidToe() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { van: string; tot: string; reden?: string | null }) => {
      const { data: me, error: meErr } = await supabase
        .from("users")
        .select("partner_id")
        .eq("id", user!.id)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!me?.partner_id) throw new Error("Je account is niet aan een organisatie gekoppeld.");
      const { error } = await supabase.from("gebruiker_afwezigheid").insert({
        user_id: user!.id,
        partner_id: me.partner_id,
        van: input.van,
        tot: input.tot,
        reden: input.reden?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Afwezigheid opgeslagen");
    },
    onError: (e: Error) => toast.error("Opslaan mislukt", { description: e.message }),
  });
}

export function useVerwijderMijnAfwezigheid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gebruiker_afwezigheid").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Verwijderd");
    },
    onError: (e: Error) => toast.error("Verwijderen mislukt", { description: e.message }),
  });
}
