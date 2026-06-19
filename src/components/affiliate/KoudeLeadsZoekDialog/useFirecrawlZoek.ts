import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExtractedLead, ZoekFormState } from "./types";

interface ZoekResponse {
  leads: ExtractedLead[];
  bronnen: number;
  melding?: string;
}

export function useFirecrawlZoek() {
  return useMutation({
    mutationFn: async (form: ZoekFormState): Promise<ZoekResponse> => {
      const payload = {
        modus: form.modus,
        query: form.modus === "search" ? form.query.trim() : undefined,
        url: form.modus === "scrape" ? form.url.trim() : undefined,
        branches: form.branches,
        regio: form.regio.trim() || undefined,
        limit: form.limit,
      };
      const { data, error } = await supabase.functions.invoke("affiliate-firecrawl-zoek", {
        body: payload,
      });
      if (error) {
        const ctx = (error as { context?: { body?: unknown } }).context?.body;
        let msg = error.message;
        if (typeof ctx === "string") {
          try { msg = (JSON.parse(ctx) as { error?: string }).error ?? msg; } catch { /* keep */ }
        }
        throw new Error(msg);
      }
      return data as ZoekResponse;
    },
  });
}