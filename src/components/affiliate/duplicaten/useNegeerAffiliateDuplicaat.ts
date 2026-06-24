import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useNegeerAffiliateDuplicaat() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadAId,
      leadBId,
      eigenaarId,
      reden,
    }: {
      leadAId: string;
      leadBId: string;
      eigenaarId: string | null;
      reden?: string;
    }) => {
      if (!profile?.id) throw new Error("Niet ingelogd");
      const [a, b] = leadAId < leadBId ? [leadAId, leadBId] : [leadBId, leadAId];
      const { error } = await supabase
        .from("lead_duplicaat_negeerlijst_affiliate" as never)
        .insert({
          eigenaar_id: eigenaarId ?? profile.id,
          lead_a_id: a,
          lead_b_id: b,
          genegeerd_door: profile.id,
          reden: reden ?? null,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paar gemarkeerd als geen duplicaat");
      qc.invalidateQueries({ queryKey: ["affiliate-lead-duplicaten"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}