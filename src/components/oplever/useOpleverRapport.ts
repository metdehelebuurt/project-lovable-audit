import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRapport, patchRapport } from "./api/opleverApi";
import { supabase } from "@/integrations/supabase/client";
import type { Opleverrapport } from "./types";

export function useOpleverRapport(id: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["opleverrapport", id],
    queryFn: () => fetchRapport(id as string),
    enabled: Boolean(id),
  });

  // Realtime: backoffice + monteur werken in hetzelfde document
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`opleverrapport-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "opleverrapporten", filter: `id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["opleverrapport", id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  return query;
}

export function usePatchRapport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Opleverrapport>) => patchRapport(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opleverrapport", id] });
    },
  });
}