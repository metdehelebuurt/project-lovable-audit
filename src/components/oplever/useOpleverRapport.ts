import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRapport, patchRapport } from "./api/opleverApi";
import type { Opleverrapport } from "./types";

export function useOpleverRapport(id: string | undefined) {
  return useQuery({
    queryKey: ["opleverrapport", id],
    queryFn: () => fetchRapport(id as string),
    enabled: Boolean(id),
  });
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