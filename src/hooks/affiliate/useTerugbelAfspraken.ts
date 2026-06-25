import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type TerugbelAfspraak = Database["public"]["Tables"]["affiliate_terugbel_afspraken"]["Row"];
type InsertBase = Database["public"]["Tables"]["affiliate_terugbel_afspraken"]["Insert"];
type Insert = InsertBase & {
  type?: "terugbel" | "demo";
  /** Wil de gebruiker een bevestigingsmail naar de klant sturen? */
  klant_bevestiging?: boolean;
  /** Overschrijving van het e-mailadres waar de klantbevestiging naartoe moet. */
  klant_email?: string | null;
};

const KEY = ["affiliate-terugbel"] as const;

export function useTerugbelAfspraken(scope: "open" | "alle" = "open") {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, scope, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TerugbelAfspraak[]> => {
      let q = supabase
        .from("affiliate_terugbel_afspraken")
        .select("*")
        .eq("affiliate_id", user!.id)
        .order("geplande_op", { ascending: true });
      if (scope === "open") q = q.is("afgehandeld_op", null);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Afspraken die door een collega zijn ingepland en waar ik (`collega_user_id`)
 * de eigenaar van ben. Zo zie ik handovers in mijn agenda.
 */
export function useAfsprakenVoorMij(scope: "open" | "alle" = "open") {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, "voor-mij", scope, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TerugbelAfspraak[]> => {
      let q = supabase
        .from("affiliate_terugbel_afspraken")
        .select("*")
        .eq("collega_user_id", user!.id)
        .neq("affiliate_id", user!.id)
        .order("geplande_op", { ascending: true });
      if (scope === "open") q = q.is("afgehandeld_op", null);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTerugbel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<Insert, "affiliate_id">) => {
      const { klant_bevestiging, klant_email, ...insertInput } = input;
      const { data, error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .insert({ ...insertInput, affiliate_id: user!.id } as InsertBase)
        .select()
        .single();
      if (error) throw error;
      // Synchroniseer volgende_actie_datum op de lead zodat de afspraak
      // ook in de belwerkbank en in 'mine' lijsten opduikt.
      if (input.lead_id && input.geplande_op) {
        await supabase
          .from("affiliate_leads")
          .update({ volgende_actie_datum: input.geplande_op })
          .eq("id", input.lead_id);
      }
      // Verstuur bevestigingsmails (klant + collega). Niet blokkerend.
      try {
        const { error: mailErr } = await supabase.functions.invoke("affiliate-afspraak-notify", {
          body: {
            afspraakId: data.id,
            klantBevestiging: klant_bevestiging ?? true,
            klantEmail: klant_email ?? null,
          },
        });
        if (mailErr) {
          console.error("affiliate-afspraak-notify", mailErr);
          toast.warning("Afspraak opgeslagen, maar mailbevestiging mislukt");
        }
      } catch (e) {
        console.error("affiliate-afspraak-notify", e);
        toast.warning("Afspraak opgeslagen, maar mailbevestiging mislukt");
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      toast.success("Terugbelafspraak gepland");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAfvinkenTerugbel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Haal eerst de afspraak op zodat we `volgende_actie_datum` op de lead
      // kunnen opruimen als die nog matcht — anders blijft de lead eeuwig
      // in de belqueue staan op basis van een stale datum.
      const { data: afs } = await supabase
        .from("affiliate_terugbel_afspraken")
        .select("id, lead_id, geplande_op")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({ afgehandeld_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (afs?.lead_id && afs.geplande_op) {
        await supabase
          .from("affiliate_leads")
          .update({ volgende_actie_datum: null })
          .eq("id", afs.lead_id)
          .eq("volgende_actie_datum", afs.geplande_op);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      toast.success("Afspraak afgevinkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
