import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlatformAfspraak {
  id: string;
  affiliate_id: string;
  lead_id: string | null;
  type: string | null;
  geplande_op: string;
  notitie: string | null;
  afgehandeld_op: string | null;
  collega_user_id: string | null;
  noshow: boolean | null;
}

export interface BusyBlock { start: string; end: string }
export interface BusyResult { busy: BusyBlock[]; linked: boolean; error?: string }

export function useSalesPlatformAfspraken(
  affiliateIds: string[],
  fromIso: string,
  toIso: string,
) {
  return useQuery({
    queryKey: ["sales-agenda", "platform", affiliateIds.slice().sort().join(","), fromIso, toIso],
    enabled: affiliateIds.length > 0,
    queryFn: async (): Promise<PlatformAfspraak[]> => {
      const { data, error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .select("id, affiliate_id, lead_id, type, geplande_op, notitie, afgehandeld_op, collega_user_id, noshow")
        .in("affiliate_id", affiliateIds)
        .gte("geplande_op", fromIso)
        .lte("geplande_op", toIso)
        .order("geplande_op", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlatformAfspraak[];
    },
    staleTime: 30_000,
  });
}

export function useSalesBusyBlocks(
  affiliateIds: string[],
  fromIso: string,
  toIso: string,
) {
  return useQuery({
    queryKey: ["sales-agenda", "busy", affiliateIds.slice().sort().join(","), fromIso, toIso],
    enabled: affiliateIds.length > 0,
    queryFn: async (): Promise<Record<string, BusyResult>> => {
      const { data, error } = await supabase.functions.invoke("affiliate-busy-blocks", {
        body: { affiliate_ids: affiliateIds, from: fromIso, to: toIso },
      });
      if (error) throw error;
      return ((data as { result?: Record<string, BusyResult> })?.result ?? {});
    },
    staleTime: 30_000,
  });
}

export interface PlanAfspraakInput {
  affiliate_id: string;
  lead_id?: string | null;
  type: "terugbel" | "demo";
  geplande_op: string;
  duur_minuten: number;
  notitie?: string | null;
}

export function usePlanAfspraakViaSales() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlanAfspraakInput) => {
      const { data, error } = await supabase.functions.invoke("affiliate-afspraak-plannen", {
        body: input,
      });
      if (error) throw error;
      const payload = data as {
        afspraak?: unknown;
        google_sync?: "synced" | "skipped" | "failed";
        google_error?: string;
        error?: string;
        message?: string;
      };
      if (payload?.error) throw new Error(payload.message || payload.error);
      return payload;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sales-agenda"] });
      if (res?.google_sync === "synced") toast.success("Afspraak gepland en in Google-agenda gezet");
      else if (res?.google_sync === "skipped") toast.success("Afspraak gepland (geen Google-koppeling)");
      else if (res?.google_sync === "failed") {
        toast.warning("Afspraak gepland, maar Google-sync mislukte", { description: res.google_error });
      } else toast.success("Afspraak gepland");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Plannen mislukt"),
  });
}

export function useAnnuleerSalesAfspraak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({ afgehandeld_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-agenda"] });
      toast.success("Afspraak afgevinkt");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bijwerken mislukt"),
  });
}