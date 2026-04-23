import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EntiteitType =
  | "lead"
  | "offerte"
  | "schouw"
  | "opdracht"
  | "klant"
  | "installatie"
  | "ticket"
  | "factuur"
  | "taak";

export type EntiteitHistorieRij =
  Database["public"]["Tables"]["entiteit_historie"]["Row"];

export function useEntiteitHistorie(
  entiteitType: EntiteitType,
  entiteitId: string | undefined,
) {
  return useQuery({
    queryKey: ["entiteit_historie", entiteitType, entiteitId],
    enabled: !!entiteitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entiteit_historie")
        .select("*")
        .eq("entiteit_type", entiteitType)
        .eq("entiteit_id", entiteitId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as EntiteitHistorieRij[];
    },
  });
}