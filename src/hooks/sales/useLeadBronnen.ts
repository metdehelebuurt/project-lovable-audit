import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type LeadBron = Database["public"]["Tables"]["lead_bronnen"]["Row"];
export type LeadBronInsert = Database["public"]["Tables"]["lead_bronnen"]["Insert"];

const KEY = ["lead-bronnen"] as const;

export function useLeadBronnen() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<LeadBron[]> => {
      const { data, error } = await supabase
        .from("lead_bronnen")
        .select("*")
        .order("volgorde", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useUpsertLeadBron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeadBronInsert & { id?: string }) => {
      if (input.id) {
        const { error } = await supabase.from("lead_bronnen").update(input).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lead_bronnen").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Bron opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLeadBron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_bronnen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Bron verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}