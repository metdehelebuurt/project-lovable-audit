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
      if (data?.lead_id) {
        await supabase.from("affiliate_opvolg_log").insert({
          lead_id: data.lead_id,
          affiliate_id: user!.id,
          taak_id: data.id,
          actie: "taak_aangemaakt",
          bron: input.bron === "ai" ? "ai" : "affiliate",
          titel: `Taak aangemaakt: ${data.titel}`,
          details: { type: data.type, prioriteit: data.prioriteit, due_op: data.due_op },
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["affiliate-opvolg-log"] });
      toast.success("Opvolg-taak toegevoegd");
    },
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
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: taak } = await supabase
        .from("affiliate_opvolg_taken")
        .select("lead_id, titel")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase
        .from("affiliate_opvolg_taken")
        .update({ voltooid_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (taak?.lead_id && user?.id) {
        await supabase.from("affiliate_opvolg_log").insert({
          lead_id: taak.lead_id,
          affiliate_id: user.id,
          taak_id: id,
          actie: "taak_voltooid",
          bron: "affiliate",
          titel: `Taak voltooid: ${taak.titel}`,
          details: {},
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["affiliate-opvolg-log"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVerzetOpvolgTaak() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, dagen }: { id: string; dagen: number }) => {
      const { data: huidig } = await supabase
        .from("affiliate_opvolg_taken")
        .select("due_op, lead_id, titel")
        .eq("id", id)
        .maybeSingle();
      const basis = huidig?.due_op ? new Date(huidig.due_op) : new Date();
      const nieuw = new Date(basis.getTime() + dagen * 86400000).toISOString();
      const { error } = await supabase
        .from("affiliate_opvolg_taken")
        .update({ due_op: nieuw, herinnering_verstuurd_op: null, escalatie_verstuurd_op: null })
        .eq("id", id);
      if (error) throw error;
      if (huidig?.lead_id && user?.id) {
        await supabase.from("affiliate_opvolg_log").insert({
          lead_id: huidig.lead_id,
          affiliate_id: user.id,
          taak_id: id,
          actie: "taak_verzet",
          bron: "affiliate",
          titel: `Taak verzet met ${dagen} dag(en): ${huidig.titel}`,
          details: { nieuwe_due_op: nieuw, dagen },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["affiliate-opvolg-log"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}