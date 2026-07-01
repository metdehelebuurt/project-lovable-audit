import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OntvangstRegel {
  product_id: string | null;
  omschrijving: string;
  besteld_aantal: number;
  ontvangen_aantal: number;
  opmerking?: string | null;
}

export interface InkoopOntvangst {
  id: string;
  partner_id: string;
  inkooporder_id: string;
  ontvangstdatum: string;
  ontvangen_door: string | null;
  regels: OntvangstRegel[];
  fotos: string[];
  opmerking: string | null;
  discrepantie: boolean;
  voorraad_geboekt: boolean;
  created_at: string;
}

export function useInkoopOntvangsten(inkooporderId: string | undefined) {
  return useQuery({
    queryKey: ["inkoop-ontvangsten", inkooporderId],
    queryFn: async () => {
      if (!inkooporderId) return [];
      const { data, error } = await supabase
        .from("inkoop_ontvangsten")
        .select("*")
        .eq("inkooporder_id", inkooporderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any as InkoopOntvangst[];
    },
    enabled: !!inkooporderId,
  });
}

export function useCreateOntvangst(opts: {
  partnerId: string | undefined;
  inkooporderId: string;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ontvangstdatum: string;
      ontvangen_door: string | null;
      regels: OntvangstRegel[];
      fotos?: string[];
      opmerking?: string | null;
    }) => {
      if (!opts.partnerId) throw new Error("Geen organisatie");
      const { error } = await supabase.from("inkoop_ontvangsten").insert({
        partner_id: opts.partnerId,
        inkooporder_id: opts.inkooporderId,
        ontvangstdatum: input.ontvangstdatum,
        ontvangen_door: input.ontvangen_door,
        regels: input.regels as any,
        fotos: (input.fotos ?? []) as any,
        opmerking: input.opmerking ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkoop-ontvangsten", opts.inkooporderId] });
      qc.invalidateQueries({ queryKey: ["inkooporder", opts.inkooporderId] });
      qc.invalidateQueries({ queryKey: ["inkooporders"] });
      qc.invalidateQueries({ queryKey: ["voorraad"] });
      toast.success("Ontvangst geregistreerd, voorraad bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}