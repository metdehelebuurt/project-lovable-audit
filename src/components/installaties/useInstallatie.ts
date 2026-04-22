import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInstallatie, updateInstallatie, type Installatie } from "./api/installatieApi";

export function useInstallatie(id: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["installatie", id],
    queryFn: () => fetchInstallatie(id!),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: (patch: Partial<Installatie>) => updateInstallatie(id!, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installatie", id] });
      qc.invalidateQueries({ queryKey: ["installaties"] });
    },
  });

  return { ...query, update };
}