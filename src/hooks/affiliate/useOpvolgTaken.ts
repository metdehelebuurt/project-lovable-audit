import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type OpvolgTaak = Database["public"]["Tables"]["affiliate_opvolg_taken"]["Row"];
type Insert = Database["public"]["Tables"]["affiliate_opvolg_taken"]["Insert"];
type Update = Database["public"]["Tables"]["affiliate_opvolg_taken"]["Update"];

const KEY = ["affiliate-opvolg-taken"] as const;

export function useOpvolgTaken(scope: "open" | "alle" = "open") {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, scope, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<OpvolgTaak[]> => {
      let q = supabase
        .from("affiliate_opvolg_taken")
        .select("*")
        .eq("affiliate_id", user!.id)
        .order("due_op", { ascending: true });
      if (scope === "open") q = q.is("voltooid_op", null);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOpvolgTakenVoorLead(leadId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "lead", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_opvolg_taken")
        .select("*")
        .eq("lead_id", leadId!)
        .order("due_op", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateOpvolgTaak() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<Insert, "affiliate_id">) => {
      const { data, error } = await supabase
        .from("affiliate_opvolg_taken")
        .insert({ ...input, affiliate_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Opvolg-taak toegevoegd"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOpvolgTaak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Update }) => {
      const { error } = await supabase.from("affiliate_opvolg_taken").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVoltooiOpvolgTaak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_opvolg_taken")
        .update({ voltooid_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVerzetOpvolgTaak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dagen }: { id: string; dagen: number }) => {
      const { data: huidig } = await supabase.from("affiliate_opvolg_taken").select("due_op").eq("id", id).maybeSingle();
      const basis = huidig?.due_op ? new Date(huidig.due_op) : new Date();
      const nieuw = new Date(basis.getTime() + dagen * 86400000).toISOString();
      const { error } = await supabase
        .from("affiliate_opvolg_taken")
        .update({ due_op: nieuw, herinnering_verstuurd_op: null, escalatie_verstuurd_op: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}