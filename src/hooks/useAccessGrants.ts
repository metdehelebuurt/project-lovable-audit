import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AccessGrant {
  id: string;
  superadmin_user_id: string;
  partner_id: string;
  reden: string;
  verleend_op: string;
  vervalt_op: string;
  notify_partner: boolean;
  ingetrokken_op: string | null;
  ingetrokken_door: string | null;
  created_at: string;
  partner?: { id: string; naam: string | null } | null;
}

export type GrantStatus = "actief" | "verlopen" | "ingetrokken";

export function getGrantStatus(g: Pick<AccessGrant, "ingetrokken_op" | "vervalt_op">): GrantStatus {
  if (g.ingetrokken_op) return "ingetrokken";
  if (new Date(g.vervalt_op) <= new Date()) return "verlopen";
  return "actief";
}

export function useAccessGrants() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["superadmin-access-grants", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<AccessGrant[]> => {
      const { data, error } = await supabase
        .from("superadmin_access_grants")
        .select("*, partner:partners(id, naam)")
        .order("verleend_op", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AccessGrant[];
    },
    refetchInterval: 60_000,
  });
}

export function useActiveAccessGrants() {
  const { data, ...rest } = useAccessGrants();
  const active = (data ?? []).filter((g) => getGrantStatus(g) === "actief");
  return { ...rest, data: active };
}

interface RequestGrantInput {
  partner_id: string;
  reden: string;
  duur_uren: number;
  notify_partner: boolean;
}

export function useRequestAccessGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestGrantInput) => {
      const { data, error } = await supabase.functions.invoke("superadmin-grant-access", {
        body: input,
      });
      if (error) throw error;
      const payload = data as { error?: string; grant?: AccessGrant };
      if (payload?.error) throw new Error(payload.error);
      return payload.grant!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-access-grants"] });
      toast.success("Tijdelijke toegang geactiveerd");
    },
    onError: (e: Error) => toast.error(e.message || "Aanvraag mislukt"),
  });
}

export function useRevokeAccessGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (grant_id: string) => {
      const { data, error } = await supabase.functions.invoke("superadmin-revoke-access", {
        body: { grant_id },
      });
      if (error) throw error;
      const payload = data as { error?: string; ok?: boolean };
      if (payload?.error) throw new Error(payload.error);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-access-grants"] });
      toast.success("Toegang ingetrokken");
    },
    onError: (e: Error) => toast.error(e.message || "Intrekken mislukt"),
  });
}