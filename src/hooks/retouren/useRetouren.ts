import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RetourType = "klant_retour" | "leverancier_retour";
export type RetourStatus =
  | "aangemeld"
  | "goedgekeurd"
  | "verzonden"
  | "ontvangen"
  | "afgehandeld"
  | "afgewezen";

export interface RetourRegel {
  product_id: string | null;
  omschrijving: string;
  aantal: number;
  serienummer?: string | null;
}

export interface Retour {
  id: string;
  partner_id: string;
  rma_nummer: string;
  type: RetourType;
  status: RetourStatus;
  opdracht_id: string | null;
  installatie_id: string | null;
  klant_id: string | null;
  leverancier_id: string | null;
  inkooporder_id: string | null;
  regels: RetourRegel[];
  reden: string;
  oplossing: "creditnota" | "vervangend_product" | "reparatie" | "geen" | null;
  fotos: string[];
  notities: string | null;
  gemaakt_door: string | null;
  afgehandeld_op: string | null;
  afgehandeld_door: string | null;
  creditnota_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseRetourenFilter {
  partnerId: string | undefined;
  klantId?: string;
  opdrachtId?: string;
  installatieId?: string;
  leverancierId?: string;
  status?: RetourStatus;
}

export function useRetouren(filter: UseRetourenFilter) {
  return useQuery({
    queryKey: ["retouren", filter],
    queryFn: async () => {
      if (!filter.partnerId) return [];
      let q = supabase
        .from("retouren")
        .select("*, klanten(voornaam, achternaam, bedrijfsnaam), leveranciers(naam), opdrachten(klant_naam)")
        .eq("partner_id", filter.partnerId)
        .order("created_at", { ascending: false });
      if (filter.klantId) q = q.eq("klant_id", filter.klantId);
      if (filter.opdrachtId) q = q.eq("opdracht_id", filter.opdrachtId);
      if (filter.installatieId) q = q.eq("installatie_id", filter.installatieId);
      if (filter.leverancierId) q = q.eq("leverancier_id", filter.leverancierId);
      if (filter.status) q = q.eq("status", filter.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!filter.partnerId,
  });
}

export function useRetour(id: string | undefined) {
  return useQuery({
    queryKey: ["retour", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("retouren")
        .select("*, klanten(voornaam, achternaam, bedrijfsnaam, email), leveranciers(naam, email), opdrachten(klant_naam)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });
}

export interface RetourInput {
  type: RetourType;
  reden: string;
  regels: RetourRegel[];
  opdracht_id?: string | null;
  installatie_id?: string | null;
  klant_id?: string | null;
  leverancier_id?: string | null;
  inkooporder_id?: string | null;
  oplossing?: Retour["oplossing"];
  notities?: string | null;
}

export function useCreateRetour(partnerId: string | undefined, gebruikerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RetourInput) => {
      if (!partnerId) throw new Error("Geen organisatie");
      const { data, error } = await supabase
        .from("retouren")
        .insert({
          partner_id: partnerId,
          rma_nummer: "", // wordt door trigger gevuld
          type: input.type,
          status: "aangemeld",
          reden: input.reden,
          regels: input.regels as any,
          opdracht_id: input.opdracht_id ?? null,
          installatie_id: input.installatie_id ?? null,
          klant_id: input.klant_id ?? null,
          leverancier_id: input.leverancier_id ?? null,
          inkooporder_id: input.inkooporder_id ?? null,
          oplossing: input.oplossing ?? null,
          notities: input.notities ?? null,
          gemaakt_door: gebruikerId ?? null,
        })
        .select("id, rma_nummer")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["retouren"] });
      toast.success(`Retour ${data.rma_nummer} aangemaakt`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRetourStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: RetourStatus;
      oplossing?: Retour["oplossing"];
      notities?: string | null;
      afgehandeld_door?: string | null;
    }) => {
      const update: any = { status: params.status };
      if (params.oplossing !== undefined) update.oplossing = params.oplossing;
      if (params.notities !== undefined) update.notities = params.notities;
      if (params.status === "afgehandeld") {
        update.afgehandeld_op = new Date().toISOString();
        if (params.afgehandeld_door) update.afgehandeld_door = params.afgehandeld_door;
      }
      const { error } = await supabase.from("retouren").update(update).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retouren"] });
      qc.invalidateQueries({ queryKey: ["retour"] });
      toast.success("Retour bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}