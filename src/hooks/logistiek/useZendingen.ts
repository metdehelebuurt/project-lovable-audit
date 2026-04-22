import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OpdrachtZending {
  id: string;
  partner_id: string;
  opdracht_id: string;
  vervoerder: string;
  trackingnummer: string | null;
  tracking_url: string | null;
  status: "gepland" | "onderweg" | "geleverd" | "geannuleerd";
  verzenddatum: string | null;
  verwachte_leverdatum: string | null;
  afleverdatum: string | null;
  ontvangen_door: string | null;
  foto_aflevering_url: string | null;
  notitie: string | null;
  created_at: string;
  updated_at: string;
}

const TRACK_URLS: Record<string, (code: string) => string> = {
  postnl: (c) => `https://jouw.postnl.nl/track-and-trace/${c}-NL-NL`,
  dhl: (c) => `https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${c}`,
  dpd: (c) => `https://tracking.dpd.de/status/nl_NL/parcel/${c}`,
  ups: (c) => `https://www.ups.com/track?tracknum=${c}`,
  gls: (c) => `https://gls-group.com/track/${c}`,
};

export const buildTrackingUrl = (vervoerder: string, code: string | null) => {
  if (!code) return null;
  const fn = TRACK_URLS[vervoerder.toLowerCase()];
  return fn ? fn(code) : null;
};

export const useZendingen = (opdrachtId?: string | null) => {
  return useQuery({
    queryKey: ["zendingen", opdrachtId],
    enabled: !!opdrachtId,
    queryFn: async (): Promise<OpdrachtZending[]> => {
      const { data, error } = await supabase
        .from("opdracht_zendingen" as any)
        .select("*")
        .eq("opdracht_id", opdrachtId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as OpdrachtZending[];
    },
  });
};

export const useUpsertZending = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<OpdrachtZending> & { opdracht_id: string; partner_id: string }) => {
      const payload: any = { ...input };
      if (payload.trackingnummer && !payload.tracking_url) {
        payload.tracking_url = buildTrackingUrl(payload.vervoerder ?? "", payload.trackingnummer);
      }
      if (input.id) {
        const { error } = await supabase
          .from("opdracht_zendingen" as any)
          .update(payload)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("opdracht_zendingen" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? "Zending bijgewerkt" : "Zending toegevoegd");
      qc.invalidateQueries({ queryKey: ["zendingen", vars.opdracht_id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fout bij opslaan"),
  });
};

export const useDeleteZending = (opdrachtId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opdracht_zendingen" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Zending verwijderd");
      qc.invalidateQueries({ queryKey: ["zendingen", opdrachtId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fout"),
  });
};