import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SchrijfstijlVoorkeuren {
  doel?: string;
  stijl?: string[];
  doelgroep?: string[];
  conversie?: string[];
  lengte?: "kort" | "gemiddeld" | "uitgebreid";
}

export interface SchrijfstijlRow {
  user_id: string;
  profiel_samenvatting: string;
  voorkeuren: SchrijfstijlVoorkeuren;
  laatst_geconsolideerd_at: string | null;
}

export function useAiSchrijfstijl() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["ai-schrijfstijl", user?.id];

  const query = useQuery({
    enabled: !!user?.id,
    queryKey,
    queryFn: async (): Promise<SchrijfstijlRow | null> => {
      const { data, error } = await supabase
        .from("ai_template_schrijfstijl")
        .select("user_id, profiel_samenvatting, voorkeuren, laatst_geconsolideerd_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as SchrijfstijlRow | null;
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: { profiel_samenvatting?: string; voorkeuren?: SchrijfstijlVoorkeuren }) => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("ai_template_schrijfstijl")
        .upsert(
          { user_id: user.id, ...input } as never,
          { onConflict: "user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Schrijfstijl opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("ai_template_schrijfstijl")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Schrijfstijl gewist — AI begint opnieuw");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, upsert, reset };
}