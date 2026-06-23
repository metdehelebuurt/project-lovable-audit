import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DelegatieScope = "view" | "plan";

export interface AgendaDelegatie {
  id: string;
  gever_user_id: string;
  ontvanger_user_id: string;
  partner_id: string;
  scope: DelegatieScope;
  actief: boolean;
  notitie: string | null;
  created_at: string;
  collega?: {
    id: string;
    voornaam: string | null;
    achternaam: string | null;
    email: string | null;
    rol: string | null;
  } | null;
}

async function fetchDelegaties(): Promise<{ uitgaand: AgendaDelegatie[]; inkomend: AgendaDelegatie[] }> {
  const { data, error } = await supabase
    .from("agenda_delegaties")
    .select("id, gever_user_id, ontvanger_user_id, partner_id, scope, actief, notitie, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as AgendaDelegatie[];
  const userIds = Array.from(
    new Set(rows.flatMap((r) => [r.gever_user_id, r.ontvanger_user_id])),
  );
  let usersMap = new Map<string, AgendaDelegatie["collega"]>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, voornaam, achternaam, email, rol")
      .in("id", userIds);
    usersMap = new Map((users ?? []).map((u) => [u.id, u as AgendaDelegatie["collega"]]));
  }
  const { data: { user } } = await supabase.auth.getUser();
  const meId = user?.id;
  const uitgaand: AgendaDelegatie[] = [];
  const inkomend: AgendaDelegatie[] = [];
  for (const r of rows) {
    if (r.gever_user_id === meId) {
      uitgaand.push({ ...r, collega: usersMap.get(r.ontvanger_user_id) ?? null });
    } else {
      inkomend.push({ ...r, collega: usersMap.get(r.gever_user_id) ?? null });
    }
  }
  return { uitgaand, inkomend };
}

export function useAgendaDelegaties() {
  return useQuery({
    queryKey: ["agenda-delegaties"],
    queryFn: fetchDelegaties,
  });
}

export function useCollegasZelfdePartner() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["collegas-partner", profile?.partner_id],
    enabled: !!profile?.partner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, email, rol")
        .eq("partner_id", profile!.partner_id!)
        .eq("status", "actief")
        .neq("id", profile!.id)
        .order("voornaam");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeelAgendaMet() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (input: { ontvanger_user_id: string; scope: DelegatieScope; notitie?: string }) => {
      if (!profile?.id || !profile.partner_id) throw new Error("Niet ingelogd");
      const { error } = await supabase.from("agenda_delegaties").upsert(
        {
          gever_user_id: profile.id,
          ontvanger_user_id: input.ontvanger_user_id,
          partner_id: profile.partner_id,
          scope: input.scope,
          actief: true,
          notitie: input.notitie ?? null,
        },
        { onConflict: "gever_user_id,ontvanger_user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agenda gedeeld");
      qc.invalidateQueries({ queryKey: ["agenda-delegaties"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delen mislukt"),
  });
}

export function useWijzigDelegatieScope() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; scope: DelegatieScope }) => {
      const { error } = await supabase
        .from("agenda_delegaties")
        .update({ scope: input.scope })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-delegaties"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Wijzigen mislukt"),
  });
}

export function useStopDelegatie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_delegaties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delegatie ingetrokken");
      qc.invalidateQueries({ queryKey: ["agenda-delegaties"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Verwijderen mislukt"),
  });
}