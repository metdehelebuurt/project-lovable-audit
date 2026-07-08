import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesTag {
  id: string;
  slug: string;
  label: string;
  kleur: string | null;
  omschrijving: string | null;
  aantal_leads: number;
  created_at: string;
  updated_at: string;
}

const KEY = ["sales-tags"] as const;

/** Alle sales-tags met bijbehorend aantal leads. */
export function useSalesTags() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SalesTag[]> => {
      const { data, error } = await supabase
        .from("sales_tags_met_aantal" as never)
        .select("*")
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SalesTag[];
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: ["sales-leads"] });
}

/** Nieuwe tag aanmaken via de catalogus. Rechten worden RLS-side gehandhaafd. */
export function useCreateSalesTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { label: string; omschrijving?: string | null; kleur?: string | null }) => {
      const slug = input.label.trim().toLowerCase().replace(/\s+/g, " ");
      if (!slug) throw new Error("Naam is verplicht");
      const { data, error } = await supabase
        .from("sales_tags")
        .insert({ slug, label: slug, omschrijving: input.omschrijving ?? null, kleur: input.kleur ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate(qc);
      toast.success("Tag aangemaakt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Tag hernoemen: past ook alle bestaande leads aan. */
export function useRenameSalesTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { oud: string; nieuw: string }) => {
      const { data, error } = await supabase.rpc("sales_tag_hernoemen", {
        _oud: input.oud,
        _nieuw: input.nieuw,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      invalidate(qc);
      toast.success(`Tag hernoemd (${n} leads bijgewerkt)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Tag verwijderen (optioneel ook uit alle leads). */
export function useDeleteSalesTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { slug: string; ookVanLeads: boolean }) => {
      const { data, error } = await supabase.rpc("sales_tag_verwijderen", {
        _slug: input.slug,
        _ook_van_leads: input.ookVanLeads,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      invalidate(qc);
      toast.success(`Tag verwijderd${n ? ` (${n} leads bijgewerkt)` : ""}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Bulk: voeg tags toe aan een set leads. */
export function useBulkTagsToevoegen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lead_ids: string[]; tags: string[] }) => {
      const { data, error } = await supabase.rpc("sales_leads_tags_toevoegen", {
        _lead_ids: input.lead_ids,
        _tags: input.tags,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      invalidate(qc);
      toast.success(`${n} leads voorzien van tag(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Bulk: verwijder tags uit een set leads. */
export function useBulkTagsVerwijderen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lead_ids: string[]; tags: string[] }) => {
      const { data, error } = await supabase.rpc("sales_leads_tags_verwijderen", {
        _lead_ids: input.lead_ids,
        _tags: input.tags,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      invalidate(qc);
      toast.success(`${n} leads bijgewerkt`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}