import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type OpvolgRegel = Database["public"]["Tables"]["affiliate_opvolg_regels"]["Row"];
type Insert = Database["public"]["Tables"]["affiliate_opvolg_regels"]["Insert"];
type Update = Database["public"]["Tables"]["affiliate_opvolg_regels"]["Update"];

export const LEAD_TYPES = ["demo", "trial", "terugbel", "algemeen"] as const;
export type OpvolgLeadType = (typeof LEAD_TYPES)[number];

export const LEAD_TYPE_LABEL: Record<OpvolgLeadType, string> = {
  demo: "Demo",
  trial: "Trial",
  terugbel: "Terugbelafspraak",
  algemeen: "Algemeen",
};

const KEY = ["affiliate-opvolg-regels"] as const;

export function useOpvolgRegels() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<OpvolgRegel[]> => {
      const { data, error } = await supabase
        .from("affiliate_opvolg_regels")
        .select("*")
        .eq("affiliate_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertOpvolgRegel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<Insert, "affiliate_id">) => {
      const payload = { ...input, affiliate_id: user!.id };
      const { data, error } = await supabase
        .from("affiliate_opvolg_regels")
        .upsert(payload, { onConflict: "affiliate_id,lead_type" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Opvolgregel opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}