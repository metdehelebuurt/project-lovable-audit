import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type OnboardingTaak = Database["public"]["Tables"]["affiliate_onboarding_taken"]["Row"];

const DEFAULT_TAKEN: { taak_key: string; label: string; volgorde: number }[] = [
  { taak_key: "profiel", label: "Vul je profielgegevens aan", volgorde: 10 },
  { taak_key: "link", label: "Maak je eerste affiliate-link aan", volgorde: 20 },
  { taak_key: "code", label: "Vraag je eerste kortingscode aan", volgorde: 30 },
  { taak_key: "claim", label: "Claim minimaal 1 lead uit de pool", volgorde: 40 },
  { taak_key: "gesprek", label: "Log je eerste klantgesprek", volgorde: 50 },
];

export function useOnboardingTaken() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate-onboarding", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<OnboardingTaak[]> => {
      const { data, error } = await supabase
        .from("affiliate_onboarding_taken")
        .select("*")
        .eq("affiliate_id", user!.id)
        .order("volgorde", { ascending: true });
      if (error) throw error;

      // Lazy-seed: maak ontbrekende defaults aan voor deze affiliate
      const aanwezig = new Set((data ?? []).map((t) => t.taak_key));
      const ontbrekend = DEFAULT_TAKEN.filter((t) => !aanwezig.has(t.taak_key));
      if (ontbrekend.length) {
        await supabase.from("affiliate_onboarding_taken").insert(
          ontbrekend.map((t) => ({ ...t, affiliate_id: user!.id })),
        );
        const { data: fresh } = await supabase
          .from("affiliate_onboarding_taken")
          .select("*")
          .eq("affiliate_id", user!.id)
          .order("volgorde", { ascending: true });
        return fresh ?? [];
      }
      return data ?? [];
    },
  });
}

export function useVinkTaakAf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, voltooid }: { id: string; voltooid: boolean }) => {
      const { error } = await supabase
        .from("affiliate_onboarding_taken")
        .update({ voltooid_op: voltooid ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliate-onboarding"] }),
  });
}
