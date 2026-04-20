import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HelpdeskTicket } from "./useTickets";
import { toast } from "sonner";

export type TicketBericht = {
  id: string;
  ticket_id: string;
  partner_id: string;
  auteur_id: string;
  richting: string;
  inhoud: string;
  bijlagen: unknown;
  created_at: string;
};

export type TicketBijlage = {
  id: string;
  ticket_id: string;
  partner_id: string;
  bestandsnaam: string;
  bestand_url: string;
  mime_type: string | null;
  bestand_grootte: number | null;
  beschrijving: string | null;
  geupload_door_id: string;
  created_at: string;
};

export type TicketTaak = {
  id: string;
  ticket_id: string;
  partner_id: string;
  titel: string;
  omschrijving: string | null;
  status: string;
  prioriteit: string;
  toegewezen_aan: string | null;
  deadline: string | null;
  gemaakt_door: string;
  voltooid_op: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketHistorie = {
  id: string;
  ticket_id: string;
  partner_id: string;
  user_id: string | null;
  actie: string;
  veld: string | null;
  oude_waarde: string | null;
  nieuwe_waarde: string | null;
  details: unknown;
  created_at: string;
};

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_tickets")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as HelpdeskTicket | null;
    },
  });
}

export function useTicketBerichten(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_berichten", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_ticket_berichten")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TicketBericht[];
    },
  });
}

export function useAddBericht() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Omit<TicketBericht, "id" | "created_at" | "bijlagen"> & { bijlagen?: unknown }) => {
      const { data, error } = await supabase
        .from("helpdesk_ticket_berichten")
        .insert(b as never)
        .select()
        .single();
      if (error) throw error;
      return data as TicketBericht;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["helpdesk_berichten", d.ticket_id] }),
    onError: (e: Error) => toast.error(`Bericht plaatsen mislukt: ${e.message}`),
  });
}

export function useTicketBijlagen(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_bijlagen", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_ticket_bijlagen")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TicketBijlage[];
    },
  });
}

export function useTicketTaken(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_taken", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_ticket_taken")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TicketTaak[];
    },
  });
}

export function useTicketHistorie(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["helpdesk_historie", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_ticket_historie")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TicketHistorie[];
    },
  });
}

export function useLogHistorie() {
  return useMutation({
    mutationFn: async (h: Omit<TicketHistorie, "id" | "created_at" | "details"> & { details?: unknown }) => {
      const { error } = await supabase.from("helpdesk_ticket_historie").insert(h as never);
      if (error) throw error;
    },
  });
}