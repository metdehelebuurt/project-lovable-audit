import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemErrorLog {
  id: string;
  created_at: string;
  bron: string;
  niveau: string;
  bericht: string;
  stacktrace: string | null;
  context: Record<string, unknown> | null;
  edge_function_naam: string | null;
  route: string | null;
  user_id: string | null;
  partner_id: string | null;
  user_email: string | null;
  user_rol: string | null;
  status_code: number | null;
  request_id: string | null;
  user_agent: string | null;
}

export interface SystemErrorFilters {
  bron?: string;
  niveau?: string;
  zoek?: string;
  emailFilter?: string;
  edgeFunctie?: string;
  uren?: number;
}

export function useSystemErrorLogs(filters: SystemErrorFilters) {
  return useQuery({
    queryKey: ["system-error-logs", filters],
    queryFn: async (): Promise<SystemErrorLog[]> => {
      const since = new Date(Date.now() - (filters.uren ?? 24) * 60 * 60 * 1000).toISOString();
      let q = supabase
        .from("system_error_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.bron) q = q.eq("bron", filters.bron);
      if (filters.niveau) q = q.eq("niveau", filters.niveau);
      if (filters.emailFilter) q = q.ilike("user_email", `%${filters.emailFilter}%`);
      if (filters.edgeFunctie) q = q.ilike("edge_function_naam", `%${filters.edgeFunctie}%`);
      if (filters.zoek) q = q.ilike("bericht", `%${filters.zoek}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SystemErrorLog[];
    },
    refetchInterval: 30_000,
  });
}

export interface SystemLogRow {
  timestamp?: number | string;
  event_message?: string;
  [key: string]: unknown;
}

export function useSystemLogs(args: {
  type: "edge" | "auth" | "postgres" | "function";
  search?: string;
  function_name?: string;
  hours?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["system-logs", args],
    enabled: args.enabled ?? true,
    queryFn: async (): Promise<SystemLogRow[]> => {
      const { data, error } = await supabase.functions.invoke("fetch-system-logs", {
        body: {
          type: args.type,
          search: args.search || undefined,
          function_name: args.function_name || undefined,
          hours: args.hours ?? 24,
          limit: 200,
        },
      });
      if (error) throw error;
      const payload = data as { result?: SystemLogRow[]; error?: string } | SystemLogRow[] | null;
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (payload.error) throw new Error(payload.error);
      return payload.result ?? [];
    },
    refetchInterval: 60_000,
  });
}