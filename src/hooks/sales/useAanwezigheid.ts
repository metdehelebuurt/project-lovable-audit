import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AfwezigheidRij {
  id: string;
  user_id: string;
  naam: string | null;
  email: string | null;
  partner_naam: string | null;
  van: string;
  tot: string;
  reden: string | null;
}

const KEY = ["sales", "aanwezigheid"] as const;

/** Afwezigheid van alle affiliates binnen een periode (alleen sales-beheerders). */
export function useAffiliateAfwezigheid(van: string, tot: string) {
  return useQuery({
    queryKey: [...KEY, van, tot],
    queryFn: async (): Promise<AfwezigheidRij[]> => {
      const { data, error } = await supabase.rpc("sales_lijst_affiliate_afwezigheid", {
        _van: van,
        _tot: tot,
      });
      if (error) throw error;
      return (data ?? []) as AfwezigheidRij[];
    },
    staleTime: 30_000,
  });
}

interface ZetInput {
  user_id: string;
  van: string;
  tot: string;
  reden?: string | null;
}

export function useZetAfwezigheid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ZetInput) => {
      const { data, error } = await supabase.rpc("sales_zet_afwezigheid", {
        _user_id: input.user_id,
        _van: input.van,
        _tot: input.tot,
        _reden: input.reden ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Afwezigheid opgeslagen");
    },
    onError: (e: Error) => toast.error("Opslaan mislukt", { description: e.message }),
  });
}

export function useVerwijderAfwezigheid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("sales_verwijder_afwezigheid", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Verwijderd");
    },
    onError: (e: Error) => toast.error("Verwijderen mislukt", { description: e.message }),
  });
}
