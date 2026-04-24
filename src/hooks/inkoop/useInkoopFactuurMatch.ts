import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InkoopFactuurMatch {
  id: string;
  partner_id: string;
  inkoopfactuur_id: string;
  inkooporder_id: string | null;
  ontvangst_id: string | null;
  status: "open" | "akkoord" | "discrepantie" | "goedgekeurd_handmatig";
  totaal_besteld: number;
  totaal_ontvangen: number;
  totaal_gefactureerd: number;
  verschil_bedrag: number;
  notitie: string | null;
  goedgekeurd_door_id: string | null;
  goedgekeurd_op: string | null;
  created_at: string;
  updated_at: string;
}

export function useInkoopFactuurMatch(inkoopfactuurId: string | undefined) {
  return useQuery({
    queryKey: ["inkoop-factuur-match", inkoopfactuurId],
    queryFn: async () => {
      if (!inkoopfactuurId) return null;
      const { data, error } = await supabase
        .from("inkoop_factuur_match")
        .select("*")
        .eq("inkoopfactuur_id", inkoopfactuurId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as any as InkoopFactuurMatch | null;
    },
    enabled: !!inkoopfactuurId,
  });
}

export function useKoppelInkoopfactuurAanOrder(inkoopfactuurId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inkooporderId: string | null) => {
      const { error } = await supabase
        .from("financiele_documenten")
        .update({ inkooporder_id: inkooporderId })
        .eq("id", inkoopfactuurId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkoop-factuur-match", inkoopfactuurId] });
      qc.invalidateQueries({ queryKey: ["financieel-document", inkoopfactuurId] });
      toast.success("Inkooporder gekoppeld, match herberekend");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGoedkeurenMatch(inkoopfactuurId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { matchId: string; notitie?: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("inkoop_factuur_match")
        .update({
          status: "goedgekeurd_handmatig",
          notitie: input.notitie ?? null,
          goedgekeurd_door_id: userData.user?.id ?? null,
          goedgekeurd_op: new Date().toISOString(),
        })
        .eq("id", input.matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkoop-factuur-match", inkoopfactuurId] });
      toast.success("Discrepantie handmatig goedgekeurd");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useOpenInkoopOrdersVoorLeverancier(partnerId: string | undefined, leverancierId: string | null | undefined) {
  return useQuery({
    queryKey: ["open-inkooporders", partnerId, leverancierId],
    queryFn: async () => {
      if (!partnerId || !leverancierId) return [];
      const { data, error } = await supabase
        .from("financiele_documenten")
        .select("id, documentnummer, totaal_bedrag, status, factuurdatum")
        .eq("partner_id", partnerId)
        .eq("type", "inkooporder")
        .eq("leverancier_id", leverancierId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!partnerId && !!leverancierId,
  });
}