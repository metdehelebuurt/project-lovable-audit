import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useNegeerDuplicaat() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadAId, leadBId, reden }: { leadAId: string; leadBId: string; reden?: string }) => {
      if (!profile?.partner_id) throw new Error("Geen partner actief");
      const [a, b] = leadAId < leadBId ? [leadAId, leadBId] : [leadBId, leadAId];
      const { error } = await supabase
        .from("lead_duplicaat_negeerlijst" as never)
        .insert({
          partner_id: profile.partner_id,
          lead_a_id: a,
          lead_b_id: b,
          genegeerd_door: profile.id,
          reden: reden ?? null,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paar gemarkeerd als geen duplicaat");
      qc.invalidateQueries({ queryKey: ["lead-duplicaten"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}