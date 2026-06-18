import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type TerugbelAfspraak = Database["public"]["Tables"]["affiliate_terugbel_afspraken"]["Row"];
type InsertBase = Database["public"]["Tables"]["affiliate_terugbel_afspraken"]["Insert"];
type Insert = InsertBase & { type?: "terugbel" | "demo" };

const KEY = ["affiliate-terugbel"] as const;

export function useTerugbelAfspraken(scope: "open" | "alle" = "open") {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, scope, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TerugbelAfspraak[]> => {
      let q = supabase
        .from("affiliate_terugbel_afspraken")
        .select("*")
        .eq("affiliate_id", user!.id)
        .order("geplande_op", { ascending: true });
      if (scope === "open") q = q.is("afgehandeld_op", null);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTerugbel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<Insert, "affiliate_id">) => {
      const { data, error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .insert({ ...input, affiliate_id: user!.id } as InsertBase)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Terugbelafspraak gepland");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAfvinkenTerugbel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({ afgehandeld_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}
