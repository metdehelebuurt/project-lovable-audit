import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CoachingTip {
  titel: string;
  toelichting: string;
  prioriteit: "hoog" | "midden" | "laag";
}

export interface CoachingResult {
  tips: CoachingTip[];
  gegenereerd_op: string | null;
  cached: boolean;
}

export function useLatestCoachingTips(repId: string | null) {
  return useQuery({
    queryKey: ["coaching-tips", repId],
    enabled: !!repId,
    queryFn: async (): Promise<CoachingResult | null> => {
      const { data, error } = await supabase
        .from("sales_coaching_tips")
        .select("tips, gegenereerd_op")
        .eq("eigenaar_id", repId!)
        .order("gegenereerd_op", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { tips: (data.tips as unknown as CoachingTip[]) ?? [], gegenereerd_op: data.gegenereerd_op, cached: true };
    },
  });
}

export function useGenerateCoachingTips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { rep_id: string; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("sales-coaching-tip", { body: p });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as CoachingResult;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["coaching-tips", vars.rep_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}