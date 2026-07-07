import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamTarget {
  id: string;
  affiliate_id: string;
  jaar: number;
  maand: number;
  target_omzet: number | null;
  target_klanten: number | null;
}

function huidigeMaand() {
  const nu = new Date();
  return { jaar: nu.getFullYear(), maand: nu.getMonth() + 1 };
}

export function useTeamTargets(jaar?: number, maand?: number) {
  const { jaar: j, maand: m } = huidigeMaand();
  const jr = jaar ?? j;
  const mn = maand ?? m;
  return useQuery({
    queryKey: ["team-targets", jr, mn],
    queryFn: async (): Promise<TeamTarget[]> => {
      const { data, error } = await supabase
        .from("affiliate_targets")
        .select("id, affiliate_id, jaar, maand, target_omzet, target_klanten")
        .eq("jaar", jr)
        .eq("maand", mn);
      if (error) throw error;
      return (data ?? []) as TeamTarget[];
    },
  });
}

export function useSetTeamTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { affiliate_id: string; jaar: number; maand: number; target_omzet: number; target_klanten?: number }) => {
      const { error } = await supabase
        .from("affiliate_targets")
        .upsert(
          { affiliate_id: p.affiliate_id, jaar: p.jaar, maand: p.maand, target_omzet: p.target_omzet, target_klanten: p.target_klanten ?? null },
          { onConflict: "affiliate_id,jaar,maand" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-targets"] });
      toast.success("Target opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}