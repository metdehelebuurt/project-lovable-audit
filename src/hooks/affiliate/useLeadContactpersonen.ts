import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Contactpersoon {
  id: string;
  lead_id: string;
  naam: string;
  functie: string | null;
  email: string | null;
  telefoon_mobiel: string | null;
  telefoon_kantoor: string | null;
  linkedin_url: string | null;
  is_hoofdcontact: boolean;
  notitie: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactpersoonInput = Omit<
  Contactpersoon,
  "id" | "created_at" | "updated_at" | "lead_id"
> & { id?: string };

const TABLE = "affiliate_lead_contactpersonen" as const;

export function useLeadContactpersonen(leadId: string | undefined) {
  return useQuery({
    enabled: !!leadId,
    queryKey: ["lead-contactpersonen", leadId],
    queryFn: async (): Promise<Contactpersoon[]> => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("lead_id", leadId)
        .order("is_hoofdcontact", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Contactpersoon[];
    },
  });
}

export function useUpsertContactpersoon(leadId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: ContactpersoonInput) => {
      const row: Record<string, unknown> = {
        ...input,
        lead_id: leadId,
      };
      if (!input.id) row.created_by = user?.id ?? null;
      const { error } = await (supabase as any).from(TABLE).upsert(row, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-contactpersonen", leadId] });
      toast.success("Contactpersoon opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteContactpersoon(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-contactpersonen", leadId] });
      toast.success("Contactpersoon verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetHoofdcontact(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ is_hoofdcontact: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-contactpersonen", leadId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}