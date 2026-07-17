import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailAccount {
  id: string;
  user_id: string | null;
  partner_id: string | null;
  provider: string;
  email_adres: string;
  label: string | null;
  is_primair: boolean;
  actief: boolean;
  needs_reauth: boolean | null;
  last_sync_at: string | null;
  laatst_gebruikt_op: string | null;
  created_at: string;
}

export function useEmailAccounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["email-accounts", userId ?? "-"],
    enabled: !!userId,
    queryFn: async (): Promise<EmailAccount[]> => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("id, user_id, partner_id, provider, email_adres, label, is_primair, actief, needs_reauth, last_sync_at, laatst_gebruikt_op, created_at")
        .eq("user_id", userId!)
        .eq("actief", true)
        .order("is_primair", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmailAccount[];
    },
    staleTime: 30_000,
  });
}

export function useSetPrimairEmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .update({ is_primair: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-accounts"] });
      toast.success("Primair e-mailadres bijgewerkt");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bijwerken mislukt"),
  });
}

export function useRenameEmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string | null }) => {
      const { error } = await supabase
        .from("email_accounts")
        .update({ label: label?.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-accounts"] }),
  });
}

export function useDisconnectEmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .update({ actief: false, is_primair: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-accounts"] });
      toast.success("E-mailaccount ontkoppeld");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ontkoppelen mislukt"),
  });
}