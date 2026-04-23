import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceBezoek = {
  id: string;
  ticket_id: string;
  partner_id: string;
  afspraak_id: string | null;
  monteur_id: string | null;
  type: string;
  status: string;
  geplande_datum: string | null;
  geplande_tijd: string | null;
  aankomst_tijd: string | null;
  vertrek_tijd: string | null;
  werkzaamheden: string | null;
  oplossing: string | null;
  klant_naam_handtekening: string | null;
  handtekening_url: string | null;
  notities: string | null;
  created_at: string;
  updated_at: string;
  geschatte_duur_minuten?: number | null;
};

export function useServiceBezoeken(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_service_bezoeken", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_service_bezoeken")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ServiceBezoek[];
    },
  });
}

export type CreateServiceBezoekInput = {
  ticket_id: string;
  partner_id: string;
  type: "service_bezoek" | "storing";
  monteur_id?: string | null;
  geplande_datum?: string | null;
  geplande_tijd?: string | null;
  notities?: string | null;
  klant_id?: string | null;
  titel?: string;
  locatie?: string | null;
  geschatte_duur_minuten?: number | null;
};

export function useCreateServiceBezoek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateServiceBezoekInput) => {
      let afspraak_id: string | null = null;
      if (input.geplande_datum && input.monteur_id) {
        const { data: afspraak, error: aErr } = await supabase
          .from("afspraken")
          .insert({
            partner_id: input.partner_id,
            adviseur_id: input.monteur_id,
            klant_id: input.klant_id ?? null,
            type: input.type,
            titel: input.titel ?? (input.type === "storing" ? "Storing - spoed" : "Service-bezoek"),
            datum: input.geplande_datum,
            start_tijd: input.geplande_tijd ?? null,
            locatie: input.locatie ?? null,
            notities: input.notities ?? null,
            status: "gepland",
          } as never)
          .select()
          .single();
        if (aErr) throw aErr;
        afspraak_id = (afspraak as { id: string }).id;
      }

      const { data, error } = await supabase
        .from("helpdesk_service_bezoeken")
        .insert({
          ticket_id: input.ticket_id,
          partner_id: input.partner_id,
          type: input.type,
          status: "gepland",
          monteur_id: input.monteur_id ?? null,
          geplande_datum: input.geplande_datum ?? null,
          geplande_tijd: input.geplande_tijd ?? null,
          notities: input.notities ?? null,
          geschatte_duur_minuten: input.geschatte_duur_minuten ?? null,
          afspraak_id,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as ServiceBezoek;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["helpdesk_service_bezoeken", d.ticket_id] });
      toast.success("Service-bezoek ingepland");
    },
    onError: (e: Error) => toast.error(`Inplannen mislukt: ${e.message}`),
  });
}

export function useUpdateServiceBezoek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ServiceBezoek> & { id: string }) => {
      const { data, error } = await supabase
        .from("helpdesk_service_bezoeken")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ServiceBezoek;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["helpdesk_service_bezoeken", d.ticket_id] });
      toast.success("Service-bezoek bijgewerkt");
    },
    onError: (e: Error) => toast.error(`Bijwerken mislukt: ${e.message}`),
  });
}