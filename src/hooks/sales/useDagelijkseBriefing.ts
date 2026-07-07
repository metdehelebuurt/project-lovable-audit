import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BriefingInhoud {
  headline?: string;
  highlights?: string[];
  acties?: string[];
  context?: {
    totaal_leads?: number;
    totaal_waarde?: number;
    totaal_stil_7d?: number;
    terugbel_afspraken_komende_week?: number;
    per_rep?: Array<{
      rep: string;
      totaal: number;
      waarde: number;
      stil7d: number;
      nextActieTeLaat: number;
      heet: number;
      activiteit: number;
    }>;
  };
}

const KEY = ["sales-manager-briefing"] as const;

export function useDagelijkseBriefing() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<BriefingInhoud> => {
      const { data, error } = await supabase.functions.invoke("sales-manager-briefing");
      if (error) throw error;
      return (data?.briefing ?? {}) as BriefingInhoud;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useRefreshBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sales-manager-briefing?force=1");
      if (error) throw error;
      return data?.briefing as BriefingInhoud;
    },
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      toast.success("Briefing vernieuwd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}