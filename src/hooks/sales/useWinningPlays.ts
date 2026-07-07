import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WinningPlayLead {
  id: string;
  bedrijfsnaam: string;
  eigenaar_id: string | null;
  geschatte_waarde: number | null;
  created_at: string;
  updated_at: string;
  winning_play_samenvatting: string | null;
  winning_play_hoogtepunten: string[] | null;
  winning_play_bijgewerkt_op: string | null;
}

export function useWinningPlays(dagen = 90) {
  return useQuery({
    queryKey: ["winning-plays", dagen],
    queryFn: async (): Promise<WinningPlayLead[]> => {
      const grens = new Date(Date.now() - dagen * 86400_000).toISOString();
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("id, bedrijfsnaam, eigenaar_id, geschatte_waarde, created_at, updated_at, winning_play_samenvatting, winning_play_hoogtepunten, winning_play_bijgewerkt_op")
        .eq("fase_slug", "gewonnen")
        .gte("updated_at", grens)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as WinningPlayLead[];
    },
  });
}

export function useGenerateWinningPlay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { lead_id: string; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("sales-winning-play", { body: p });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as { samenvatting: string; hoogtepunten: string[]; cached: boolean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["winning-plays"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveWinningPlaySnippet() {
  return useMutation({
    mutationFn: async (p: { titel: string; body: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("Niet ingelogd");
      const { error } = await supabase.from("sales_snippets").insert({
        eigenaar_id: user.user.id,
        kanaal: "notitie",
        titel: p.titel.slice(0, 120),
        body: p.body,
        actief: true,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Winning play opgeslagen als snippet"),
    onError: (e: Error) => toast.error(e.message),
  });
}