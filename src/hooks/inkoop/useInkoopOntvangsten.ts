import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OntvangstRegel {
  product_id: string | null;
  omschrijving: string;
  besteld_aantal: number;
  ontvangen_aantal: number;
  opmerking?: string | null;
  // Optionele serienummers per ontvangen stuk. Wordt ook los in sn_per_regel bewaard,
  // maar mag hier meelopen voor snelle lezing.
  serienummers?: string[];
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
  pakbon_nummer?: string | null;
  vervoerder?: string | null;
  tracking_nummer?: string | null;
  chauffeur_naam?: string | null;
  aflever_locatie?: string | null;
  staat_zending?: string | null;
  ontvangst_document_url?: string | null;
  sn_per_regel?: Array<{ regel_index: number; product_id: string | null; serienummers: string[] }>;
  document_ids?: string[];
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
      pakbon_nummer?: string | null;
      vervoerder?: string | null;
      tracking_nummer?: string | null;
      chauffeur_naam?: string | null;
      aflever_locatie?: string | null;
      staat_zending?: string | null;
      ontvangst_document_url?: string | null;
      sn_per_regel?: Array<{ regel_index: number; product_id: string | null; serienummers: string[] }>;
      document_ids?: string[];
    }) => {
      if (!opts.partnerId) throw new Error("Geen organisatie");
      const { data, error } = await supabase.from("inkoop_ontvangsten").insert({
        partner_id: opts.partnerId,
        inkooporder_id: opts.inkooporderId,
        ontvangstdatum: input.ontvangstdatum,
        ontvangen_door: input.ontvangen_door,
        regels: input.regels as any,
        fotos: (input.fotos ?? []) as any,
        opmerking: input.opmerking ?? null,
        pakbon_nummer: input.pakbon_nummer ?? null,
        vervoerder: input.vervoerder ?? null,
        tracking_nummer: input.tracking_nummer ?? null,
        chauffeur_naam: input.chauffeur_naam ?? null,
        aflever_locatie: input.aflever_locatie ?? null,
        staat_zending: input.staat_zending ?? null,
        ontvangst_document_url: input.ontvangst_document_url ?? null,
        sn_per_regel: (input.sn_per_regel ?? []) as any,
        document_ids: (input.document_ids ?? []) as any,
      } as any).select("id").maybeSingle();
      if (error) throw error;
      return data?.id as string | undefined;
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