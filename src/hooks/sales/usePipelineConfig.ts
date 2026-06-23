import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PipelineFase } from "@/lib/sales/pipeline";

const KEY = ["pipeline-config-mine"] as const;

/** Haalt de pipeline van de huidige gebruiker op; seedt defaults indien leeg. */
export function useMyPipeline() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PipelineFase[]> => {
      const { data, error } = await supabase.rpc("get_my_pipeline");
      if (error) throw error;
      return (data ?? []) as PipelineFase[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PipelineFase> & { fase_key: string; label: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Niet ingelogd");
      const payload = { ...input, user_id: uid };
      const { data, error } = await supabase
        .from("pipeline_configuraties")
        .upsert(payload, { onConflict: "user_id,fase_key" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<PipelineFase> }) => {
      const { data, error } = await supabase
        .from("pipeline_configuraties")
        .update(input.patch)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pipeline_configuraties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Fase verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHerordenFases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; volgorde: number }[]) => {
      const results = await Promise.all(
        input.map((r) =>
          supabase.from("pipeline_configuraties").update({ volgorde: r.volgorde }).eq("id", r.id),
        ),
      );
      const fout = results.find((r) => r.error);
      if (fout?.error) throw fout.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}