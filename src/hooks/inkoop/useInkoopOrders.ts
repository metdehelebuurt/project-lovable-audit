import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InkoopOrderRegel {
  product_id?: string | null;
  omschrijving: string;
  aantal: number;
  eenheid?: string;
  prijs: number;
  btw_percentage: number;
  totaal: number;
}

export interface InkoopOrderRow {
  id: string;
  documentnummer: string;
  status: string;
  factuurdatum: string;
  gewenste_leverdatum: string | null;
  bevestigde_leverdatum: string | null;
  leverancier_id: string | null;
  totaal_bedrag: number;
  goedgekeurd_op: string | null;
  goedgekeurd_door_id: string | null;
  verzonden_op: string | null;
  verzonden_via: string | null;
  opdracht_id: string | null;
  partner_id: string;
  regels: InkoopOrderRegel[];
  notities: string | null;
  interne_notities: string | null;
  leverancier_referentie: string | null;
  leveringsadres: Record<string, unknown> | null;
  created_at: string;
  leverancier?: { id: string; naam: string; email?: string | null; contactpersoon?: string | null } | null;
}

export function useInkoopOrders(partnerId: string | undefined, opts?: { status?: string[] }) {
  return useQuery({
    queryKey: ["inkooporders", partnerId, opts?.status?.join(",")],
    enabled: !!partnerId,
    queryFn: async () => {
      let q = supabase
        .from("financiele_documenten")
        .select(`
          id, documentnummer, status, factuurdatum, gewenste_leverdatum, bevestigde_leverdatum,
          leverancier_id, totaal_bedrag, goedgekeurd_op, goedgekeurd_door_id,
          verzonden_op, verzonden_via, opdracht_id, partner_id, regels, notities,
          interne_notities, leverancier_referentie, leveringsadres, created_at,
          leverancier:leveranciers(id, naam, email, contactpersoon)
        `)
        .eq("partner_id", partnerId)
        .eq("type", "inkooporder")
        .order("created_at", { ascending: false });
      if (opts?.status?.length) q = q.in("status", opts.status as any);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as InkoopOrderRow[];
    },
  });
}

export function useInkoopOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["inkooporder", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financiele_documenten")
        .select(`
          *,
          leverancier:leveranciers(id, naam, email, contactpersoon, telefoon, adres, postcode, plaats)
        `)
        .eq("id", id!).single();
      if (error) throw error;
      return data as unknown as InkoopOrderRow & {
        leverancier?: {
          id: string; naam: string; email: string | null; contactpersoon: string | null;
          telefoon: string | null; adres: string | null; postcode: string | null; plaats: string | null;
        } | null;
      };
    },
  });
}

export function useGoedkeurInkoopOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("financiele_documenten")
        .update({
          goedgekeurd_op: new Date().toISOString(),
          goedgekeurd_door_id: params.userId,
          status: "concept",
        } as any)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["inkooporders"] });
      qc.invalidateQueries({ queryKey: ["inkooporder", vars.id] });
      toast.success("Inkooporder goedgekeurd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVraagGoedkeuringAan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financiele_documenten")
        .update({ status: "wacht_goedkeuring" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["inkooporders"] });
      qc.invalidateQueries({ queryKey: ["inkooporder", id] });
      toast.success("Goedkeuring aangevraagd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAnnuleerInkoopOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financiele_documenten")
        .update({ status: "geannuleerd" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inkooporders"] });
      toast.success("Inkooporder geannuleerd");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Markeert een inkooporder als 'besteld' zonder de e-mail-dialog te openen.
 * Gebruik dit als de bestelling al buiten het systeem is geplaatst
 * (telefonisch, portal, WhatsApp, e.d.) — de order gaat door naar
 * de ontvangstfase.
 */
export function useMarkeerInkoopOrderBesteld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financiele_documenten")
        .update({
          status: "verzonden",
          verzonden_op: new Date().toISOString(),
          verzonden_via: "handmatig",
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["inkooporders"] });
      qc.invalidateQueries({ queryKey: ["inkooporder", id] });
      toast.success("Inkooporder gemarkeerd als besteld");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}