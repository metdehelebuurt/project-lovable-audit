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