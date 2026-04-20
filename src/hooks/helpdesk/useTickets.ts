import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type HelpdeskTicket = {
  id: string;
  partner_id: string;
  ticketnummer: string;
  titel: string;
  omschrijving: string | null;
  status: string;
  prioriteit: string;
  type: string;
  kanaal: string;
  bron_locatie: string;
  klant_id: string | null;
  lead_id: string | null;
  opdracht_id: string | null;
  installatie_id: string | null;
  factuur_id: string | null;
  product_categorie: string | null;
  product_merk: string | null;
  product_type: string | null;
  product_installatiejaar: number | null;
  foutcode: string | null;
  toegewezen_aan: string | null;
  gemaakt_door: string;
  sla_deadline: string | null;
  is_geescaleerd: boolean;
  oplossing: string | null;
  opgelost_op: string | null;
  gesloten_op: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketFilters = {
  status?: string;
  prioriteit?: string;
  type?: string;
  toegewezen_aan?: string;
  klant_id?: string;
  zoekterm?: string;
};

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ["helpdesk_tickets", filters],
    queryFn: async () => {
      let q = supabase
        .from("helpdesk_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.status) q = q.eq("status", filters.status as never);
      if (filters.prioriteit) q = q.eq("prioriteit", filters.prioriteit as never);
      if (filters.type) q = q.eq("type", filters.type as never);
      if (filters.toegewezen_aan) q = q.eq("toegewezen_aan", filters.toegewezen_aan);
      if (filters.klant_id) q = q.eq("klant_id", filters.klant_id);
      if (filters.zoekterm) {
        q = q.or(
          `titel.ilike.%${filters.zoekterm}%,ticketnummer.ilike.%${filters.zoekterm}%,omschrijving.ilike.%${filters.zoekterm}%`,
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as HelpdeskTicket[];
    },
  });
}

export type CreateTicketInput = {
  partner_id: string;
  gemaakt_door: string;
  titel: string;
  omschrijving?: string | null;
  prioriteit?: string;
  type?: string;
  kanaal?: string;
  bron_locatie?: string;
  klant_id?: string | null;
  lead_id?: string | null;
  opdracht_id?: string | null;
  installatie_id?: string | null;
  factuur_id?: string | null;
  product_categorie?: string | null;
  product_merk?: string | null;
  product_type?: string | null;
  product_installatiejaar?: number | null;
  foutcode?: string | null;
  toegewezen_aan?: string | null;
};

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      const { data: nummer, error: numErr } = await supabase.rpc(
        "generate_helpdesk_ticketnummer",
        { _partner_id: input.partner_id },
      );
      if (numErr) throw numErr;

      const { data, error } = await supabase
        .from("helpdesk_tickets")
        .insert({
          ...input,
          ticketnummer: nummer as string,
          status: "nieuw",
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as HelpdeskTicket;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["helpdesk_tickets"] });
      toast.success("Ticket aangemaakt");
    },
    onError: (e: Error) => toast.error(`Aanmaken mislukt: ${e.message}`),
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<HelpdeskTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from("helpdesk_tickets")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as HelpdeskTicket;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["helpdesk_tickets"] });
      qc.invalidateQueries({ queryKey: ["helpdesk_ticket", data.id] });
      toast.success("Ticket bijgewerkt");
    },
    onError: (e: Error) => toast.error(`Bijwerken mislukt: ${e.message}`),
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("helpdesk_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["helpdesk_tickets"] });
      toast.success("Ticket verwijderd");
    },
    onError: (e: Error) => toast.error(`Verwijderen mislukt: ${e.message}`),
  });
}