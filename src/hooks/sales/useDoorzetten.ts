import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AffiliateOptie {
  id: string;
  naam: string;
  email: string;
}

/** Alle actieve affiliate-gebruikers ophalen voor de doorzet-dropdown. */
export function useAffiliateGebruikers() {
  return useQuery({
    queryKey: ["sales-affiliates"],
    queryFn: async (): Promise<AffiliateOptie[]> => {
      const { data, error } = await supabase.rpc("admin_lijst_sales_affiliates");
      if (error) throw error;
      return (data ?? []).map((u: { id: string; voornaam: string | null; achternaam: string | null; email: string | null }) => ({
        id: u.id,
        email: u.email ?? "",
        naam: [u.voornaam, u.achternaam].filter(Boolean).join(" ").trim() || u.email || "Onbekend",
      }));
    },
  });
}

import type { Temperatuur } from "@/lib/sales/temperatuur";

export interface DoorzetInput {
  lead_id: string;
  /** null = in de pool plaatsen */
  affiliate_id: string | null;
  notitie?: string;
  temperatuur?: Temperatuur | null;
  volgende_actie_op?: string | null; // ISO timestamp
}

export function useDoorzetten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DoorzetInput) => {
      const { data, error } = await supabase.rpc("admin_doorzetten_naar_affiliate_v2", {
        _lead_id: input.lead_id,
        _affiliate_id: input.affiliate_id as unknown as string,
        _notitie: input.notitie ?? null,
        _temperatuur: (input.temperatuur ?? null) as never,
        _volgende_actie_op: input.volgende_actie_op ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success(input.affiliate_id ? "Lead doorgezet naar affiliate" : "Lead in pool geplaatst");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkDoorzetten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      lead_ids: string[];
      affiliate_id: string | null;
      notitie?: string;
      temperatuur?: Temperatuur | null;
      volgende_actie_op?: string | null;
    }) => {
      const results = await Promise.allSettled(
        input.lead_ids.map((id) =>
          supabase.rpc("admin_doorzetten_naar_affiliate_v2", {
            _lead_id: id,
            _affiliate_id: input.affiliate_id as unknown as string,
            _notitie: input.notitie ?? null,
            _temperatuur: (input.temperatuur ?? null) as never,
            _volgende_actie_op: input.volgende_actie_op ?? null,
          }),
        ),
      );
      const fout = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error));
      return { ok: results.length - fout.length, fout: fout.length };
    },
    onSuccess: ({ ok, fout }) => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      if (fout === 0) toast.success(`${ok} leads doorgezet`);
      else toast.warning(`${ok} doorgezet, ${fout} mislukt`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lead_ids: string[]; fase: string }) => {
      const { data, error } = await supabase.rpc("admin_bulk_update_sales_fase", {
        _lead_ids: input.lead_ids,
        _fase: input.fase as never,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success(`${n} leads bijgewerkt`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead_ids: string[]) => {
      const { data, error } = await supabase.rpc("admin_bulk_delete_sales_leads", {
        _lead_ids: lead_ids,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success(`${n} leads verwijderd`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}