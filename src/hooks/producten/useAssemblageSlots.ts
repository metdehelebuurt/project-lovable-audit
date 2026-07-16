import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProductRol, SlotType } from "@/lib/assemblage/typeTemplates";

export interface AssemblageSlot {
  id: string;
  partner_id: string;
  assemblage_id: string;
  sleutel: string;
  label: string;
  slot_type: SlotType;
  product_rol_filter: ProductRol | null;
  categorie_filter: string | null;
  spec_filter: Record<string, string> | null;
  min_aantal: number;
  max_aantal: number;
  default_aantal: number;
  verplicht: boolean;
  volgorde: number;
  helptekst: string | null;
}

export function useAssemblageSlots(assemblageId?: string | null) {
  return useQuery({
    queryKey: ["assemblage-slots", assemblageId],
    enabled: !!assemblageId,
    queryFn: async (): Promise<AssemblageSlot[]> => {
      const { data, error } = await supabase
        .from("product_assemblage_slots" as never)
        .select("*")
        .eq("assemblage_id", assemblageId!)
        .order("volgorde");
      if (error) throw error;
      return (data ?? []) as unknown as AssemblageSlot[];
    },
  });
}

export interface UpsertSlotInput
  extends Omit<AssemblageSlot, "id" | "partner_id"> {
  id?: string;
  partner_id: string;
}

export function useUpsertSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertSlotInput) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("product_assemblage_slots" as never)
          .update(rest as never)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("product_assemblage_slots" as never)
        .insert(rest as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (_id, v) => {
      qc.invalidateQueries({ queryKey: ["assemblage-slots", v.assemblage_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; assemblage_id: string }) => {
      const { error } = await supabase
        .from("product_assemblage_slots" as never)
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["assemblage-slots", v.assemblage_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Bulk-inserteert de default slots van een template zodat een nieuwe assemblage
 * meteen een werkende configuratie heeft. Bestaande slots worden niet aangeraakt.
 */
export function useApplyTemplateSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      assemblage_id: string;
      partner_id: string;
      slots: Array<Omit<AssemblageSlot, "id" | "partner_id" | "assemblage_id" | "volgorde">>;
    }) => {
      if (!input.slots.length) return;
      const rows = input.slots.map((s, idx) => ({
        ...s,
        assemblage_id: input.assemblage_id,
        partner_id: input.partner_id,
        volgorde: (idx + 1) * 10,
      }));
      const { error } = await supabase
        .from("product_assemblage_slots" as never)
        .insert(rows as never);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["assemblage-slots", v.assemblage_id] });
      toast.success("Standaard-slots toegevoegd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}