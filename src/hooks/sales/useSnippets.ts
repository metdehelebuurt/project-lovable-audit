import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type SalesSnippet = Database["public"]["Tables"]["sales_snippets"]["Row"];
export type SalesSnippetInsert = Database["public"]["Tables"]["sales_snippets"]["Insert"];

const KEY = ["sales-snippets"] as const;

export function useSnippets() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SalesSnippet[]> => {
      const { data, error } = await supabase
        .from("sales_snippets")
        .select("*")
        .order("volgorde", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useUpsertSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SalesSnippetInsert & { id?: string }) => {
      if (input.id) {
        const { error } = await supabase.from("sales_snippets").update(input).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sales_snippets").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Snippet opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_snippets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Snippet verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Variabelen invullen in body/onderwerp ({{bedrijfsnaam}} etc). */
export function vulVariabelen(tekst: string, vars: Record<string, string | null | undefined>): string {
  return tekst.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}