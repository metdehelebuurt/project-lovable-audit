import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AffiliateOptie {
  id: string;
  naam: string;
  email: string;
}

/** Alle actieve affiliate-gebruikers ophalen voor de doorzet-dropdown. */
export function useAffiliateGebruikers() {
  return useQuery({
    queryKey: ["sales-affiliates"],
    queryFn: async (): Promise<AffiliateOptie[]> => {
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, email, rol, status")
        .eq("rol", "affiliate")
        .eq("status", "actief")
        .order("voornaam");
      if (error) throw error;
      return (data ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "",
        naam: [u.voornaam, u.achternaam].filter(Boolean).join(" ").trim() || u.email || "Onbekend",
      }));
    },
  });
}

export interface DoorzetInput {
  lead_id: string;
  /** null = in de pool plaatsen */
  affiliate_id: string | null;
  notitie?: string;
}

export function useDoorzetten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DoorzetInput) => {
      const { data, error } = await supabase.rpc("admin_doorzetten_naar_affiliate", {
        _lead_id: input.lead_id,
        _affiliate_id: input.affiliate_id as unknown as string,
        _notitie: input.notitie ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success(input.affiliate_id ? "Lead doorgezet naar affiliate" : "Lead in pool geplaatst");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}