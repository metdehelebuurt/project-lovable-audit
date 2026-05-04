import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useGereedheidOverride(installatieId: string, partnerId: string) {
  const qc = useQueryClient();
  const { profile } = useAuth();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["installatie-gereedheid", installatieId] });
  };

  const markeer = useMutation({
    mutationFn: async ({ itemKey, notitie }: { itemKey: string; notitie?: string | null }) => {
      const { error } = await supabase
        .from("installatie_gereedheid_overrides")
        .upsert(
          {
            installatie_id: installatieId,
            partner_id: partnerId,
            item_key: itemKey,
            voltooid_op: new Date().toISOString(),
            voltooid_door: profile?.id ?? null,
            notitie: notitie ?? null,
          },
          { onConflict: "installatie_id,item_key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Handmatig gemarkeerd als compleet");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verwijder = useMutation({
    mutationFn: async (itemKey: string) => {
      const { error } = await supabase
        .from("installatie_gereedheid_overrides")
        .delete()
        .eq("installatie_id", installatieId)
        .eq("item_key", itemKey);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Handmatige markering verwijderd");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { markeer, verwijder };
}