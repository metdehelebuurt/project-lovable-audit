import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InkoopVoorstel {
  id: string;
  partner_id: string;
  product_id: string;
  leverancier_id: string | null;
  aantal: number;
  reden: "tekort_opdracht" | "onder_minimum" | "handmatig";
  opdracht_id: string | null;
  inkoopprijs: number | null;
  levertijd_dagen: number | null;
  status: "open" | "verwerkt" | "genegeerd";
  inkooporder_id: string | null;
  notitie: string | null;
  created_at: string;
}

export interface InkoopVoorstelMetContext extends InkoopVoorstel {
  product?: { id: string; naam: string; eenheid?: string | null } | null;
  leverancier?: { id: string; naam: string } | null;
  opdracht?: { id: string; klant_naam?: string | null } | null;
}

export function useInkoopVoorstellen(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["inkoop-voorstellen", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inkoop_voorstellen" as any)
        .select(`
          *,
          product:producten(id, naam, eenheid),
          leverancier:leveranciers(id, naam),
          opdracht:opdrachten(id, klant_naam)
        `)
        .eq("partner_id", partnerId)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InkoopVoorstelMetContext[];
    },
  });
}

export function useGenereerVoorstellen(partnerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!partnerId) throw new Error("Geen organisatie");
      const { error } = await supabase.rpc("bereken_inkoop_voorstellen" as any, {
        _partner_id: partnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkoop-voorstellen", partnerId] });
      toast.success("Inkoopvoorstellen bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVoorstellenNaarConcept(partnerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (voorstelIds: string[]) => {
      if (voorstelIds.length === 0) throw new Error("Selecteer minimaal één voorstel");
      const { data, error } = await supabase.rpc("inkoop_voorstellen_naar_concept" as any, {
        _voorstel_ids: voorstelIds,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ inkooporder_id: string; leverancier_id: string; regelcount: number }>;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["inkoop-voorstellen", partnerId] });
      qc.invalidateQueries({ queryKey: ["inkooporders"] });
      toast.success(`${created.length} concept-inkooporder(s) aangemaakt`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useNegeerVoorstel(partnerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inkoop_voorstellen" as any)
        .update({ status: "genegeerd" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkoop-voorstellen", partnerId] });
      toast.success("Voorstel genegeerd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}