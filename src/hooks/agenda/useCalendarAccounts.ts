import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CalendarAccount {
  id: string;
  user_id: string;
  google_email: string;
  label: string | null;
  kleur: string | null;
  is_primair: boolean;
  actief: boolean;
  laatste_fout: string | null;
  created_at: string;
}

export function useCalendarAccounts() {
  return useQuery({
    queryKey: ["calendar-accounts"],
    queryFn: async (): Promise<CalendarAccount[]> => {
      const { data, error } = await supabase
        .from("google_calendar_accounts")
        .select("id, user_id, google_email, label, kleur, is_primair, actief, laatste_fout, created_at")
        .eq("actief", true)
        .order("is_primair", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarAccount[];
    },
    staleTime: 30_000,
  });
}

export function useSetPrimairCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("google_calendar_accounts")
        .update({ is_primair: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-accounts"] });
      toast.success("Primaire agenda bijgewerkt");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bijwerken mislukt"),
  });
}

export function useUpdateCalendarAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label, kleur }: { id: string; label?: string | null; kleur?: string | null }) => {
      const patch: Record<string, unknown> = {};
      if (label !== undefined) patch.label = label?.trim() || null;
      if (kleur !== undefined) patch.kleur = kleur;
      const { error } = await supabase
        .from("google_calendar_accounts")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-accounts"] }),
  });
}

export function useDisconnectCalendarAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("google-calendar-disconnect", {
        body: { account_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-accounts"] });
      toast.success("Agenda ontkoppeld");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ontkoppelen mislukt"),
  });
}