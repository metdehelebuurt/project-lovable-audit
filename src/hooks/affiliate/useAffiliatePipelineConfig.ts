import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PipelineFaseConfig = {
  id: string;
  partner_id: string;
  status_key: string;
  label: string;
  kleur: string;
  volgorde: number;
  zichtbaar: boolean;
  is_systeem: boolean;
};

const KEY = ["affiliate-pipeline-config"] as const;

export function useAffiliatePipelineConfig() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PipelineFaseConfig[]> => {
      const { data, error } = await supabase
        .from("affiliate_pipeline_config")
        .select("*")
        .order("volgorde", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PipelineFaseConfig[];
    },
    staleTime: 60_000,
  });
}

export function useUpdatePipelineFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<PipelineFaseConfig, "label" | "kleur" | "volgorde" | "zichtbaar">>;
    }) => {
      const { error } = await supabase
        .from("affiliate_pipeline_config")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHerordenPipelineFases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rijen: { id: string; volgorde: number }[]) => {
      for (const r of rijen) {
        const { error } = await supabase
          .from("affiliate_pipeline_config")
          .update({ volgorde: r.volgorde })
          .eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}