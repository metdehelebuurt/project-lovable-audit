import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useBerichtenZichtbaarheid,
  fetchToegewezenEntiteiten,
  buildToegewezenFilter,
} from "@/hooks/useBerichtenZichtbaarheid";

export interface ActiecentrumCounts {
  notificaties: number;
  taken: number;
  berichten: number;
  terugbel: number;
  aandacht: number;
  totaal: number;
}

export function useActiecentrum() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const partnerId = profile?.partner_id;
  const zichtbaarheid = useBerichtenZichtbaarheid();

  const queries = useQueries({
    queries: [
      {
        queryKey: ["ac-notif", userId],
        enabled: !!userId,
        queryFn: async () => {
          const { data } = await supabase.from("notificaties").select("*").eq("user_id", userId!).eq("gelezen", false).order("created_at", { ascending: false }).limit(50);
          return data ?? [];
        },
      },
      {
        queryKey: ["ac-taken", userId],
        enabled: !!userId,
        queryFn: async () => {
          const { data } = await supabase
            .from("helpdesk_ticket_taken")
            .select("*")
            .eq("toegewezen_aan", userId!)
            .in("status", ["open", "in_behandeling"])
            .order("deadline", { ascending: true, nullsFirst: false })
            .limit(50);
          return data ?? [];
        },
      },
      {
        queryKey: ["ac-berichten", partnerId, userId, zichtbaarheid],
        enabled: !!partnerId && !!userId,
        queryFn: async () => {
          if (zichtbaarheid === "geen") return [];
          const { data: emails } = await supabase
            .from("email_berichten")
            .select("id, onderwerp, van, datum, klant_id, lead_id")
            .eq("partner_id", partnerId!)
            .eq("is_gelezen", false)
            .eq("richting", "inkomend")
            .order("datum", { ascending: false })
            .limit(20);
          if (zichtbaarheid !== "toegewezen") return emails ?? [];
          // Filter client-side op toegewezen entiteiten
          const ids = await fetchToegewezenEntiteiten(supabase, userId!, partnerId!);
          const leadSet = new Set(ids.leadIds);
          const klantSet = new Set(ids.klantIds);
          return (emails ?? []).filter(
            (e) =>
              (e.lead_id && leadSet.has(e.lead_id)) ||
              (e.klant_id && klantSet.has(e.klant_id)),
          );
        },
      },
      {
        queryKey: ["ac-terugbel", userId, partnerId],
        enabled: !!userId && !!partnerId,
        queryFn: async () => {
          const { data } = await supabase
            .from("leads")
            .select("id, voornaam, achternaam, telefoon, lead_status, updated_at")
            .eq("partner_id", partnerId!)
            .eq("owner_user_id", userId!)
            .in("lead_status", ["terugbellen", "geen_gehoor", "voicemail"])
            .order("updated_at", { ascending: false })
            .limit(30);
          return data ?? [];
        },
      },
      {
        queryKey: ["ac-aandacht", userId, partnerId],
        enabled: !!userId && !!partnerId,
        queryFn: async () => {
          const today = new Date().toISOString().slice(0, 10);
          const week = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
          const weekGeleden = new Date(Date.now() - 7 * 86400_000).toISOString();
          const [tickets, installaties, offertes, facturen] = await Promise.all([
            supabase.from("helpdesk_tickets").select("id, ticketnummer, titel").eq("partner_id", partnerId!).eq("toegewezen_aan", userId!).eq("is_geescaleerd", true).limit(20),
            supabase.from("installaties").select("id, installatienummer, consument_naam, geplande_startdatum").eq("partner_id", partnerId!).gte("geplande_startdatum", today).lte("geplande_startdatum", week).in("status", ["concept", "gepland"]).limit(20),
            supabase.from("offertes").select("id, offertenummer, klant_naam, created_at").eq("partner_id", partnerId!).eq("status", "verzonden").lt("created_at", weekGeleden).limit(20),
            supabase.from("financiele_documenten").select("id, documentnummer, totaal_bedrag, vervaldatum").eq("partner_id", partnerId!).eq("type", "verkoopfactuur").eq("status", "verzonden").lt("vervaldatum", today).limit(20),
          ]);
          return {
            geescaleerd: tickets.data ?? [],
            installaties_komend: installaties.data ?? [],
            offertes_oud: offertes.data ?? [],
            facturen_vervallen: facturen.data ?? [],
          };
        },
      },
    ],
  });

  const [notif, taken, berichten, terugbel, aandacht] = queries;

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const channelName = `actiecentrum:${userId}:${Math.random().toString(36).slice(2, 8)}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "notificaties", filter: `user_id=eq.${userId}` }, () => notif.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "helpdesk_ticket_taken", filter: `toegewezen_aan=eq.${userId}` }, () => taken.refetch())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "email_berichten" }, () => berichten.refetch())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [userId, notif, taken, berichten]);

  const aandachtData = (aandacht.data ?? { geescaleerd: [], installaties_komend: [], offertes_oud: [], facturen_vervallen: [] }) as {
    geescaleerd: Array<{ id: string; ticketnummer: string; titel: string }>;
    installaties_komend: Array<{ id: string; installatienummer: string | null; consument_naam: string | null; geplande_startdatum: string | null }>;
    offertes_oud: Array<{ id: string; offertenummer: string; klant_naam: string | null; created_at: string | null }>;
    facturen_vervallen: Array<{ id: string; documentnummer: string; totaal_bedrag: number; vervaldatum: string | null }>;
  };
  const aandachtAantal =
    aandachtData.geescaleerd.length +
    aandachtData.installaties_komend.length +
    aandachtData.offertes_oud.length +
    aandachtData.facturen_vervallen.length;

  const counts: ActiecentrumCounts = {
    notificaties: (notif.data ?? []).length,
    taken: (taken.data ?? []).length,
    berichten: (berichten.data ?? []).length,
    terugbel: (terugbel.data ?? []).length,
    aandacht: aandachtAantal,
    totaal:
      (notif.data ?? []).length +
      (taken.data ?? []).length +
      (berichten.data ?? []).length +
      (terugbel.data ?? []).length +
      aandachtAantal,
  };

  return {
    counts,
    notificaties: notif.data ?? [],
    taken: taken.data ?? [],
    berichten: berichten.data ?? [],
    terugbel: terugbel.data ?? [],
    aandacht: aandachtData,
    isLoading: queries.some(q => q.isLoading),
    refetch: () => queries.forEach(q => q.refetch()),
  };
}

export function useActiecentrumTotaal() {
  const { counts } = useActiecentrum();
  return counts.totaal;
}

// Lightweight: only fetches counts via head:exact for header badge
export function useActiecentrumBadgeCount() {
  const { user, profile } = useAuth();
  const zichtbaarheid = useBerichtenZichtbaarheid();
  return useQuery({
    queryKey: ["ac-badge", user?.id, zichtbaarheid],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!user?.id) return 0;
      const today = new Date().toISOString().slice(0, 10);
      const berichtenCountP = (zichtbaarheid === "geen" || !profile?.partner_id)
        ? Promise.resolve({ count: 0 } as { count: number })
        : zichtbaarheid === "alle"
        ? supabase.from("email_berichten").select("id", { count: "exact", head: true }).eq("partner_id", profile.partner_id).eq("is_gelezen", false).eq("richting", "inkomend")
        : (async () => {
            const ids = await fetchToegewezenEntiteiten(supabase, user.id, profile.partner_id!);
            const filter = buildToegewezenFilter(ids);
            if (!filter) return { count: 0 };
            const r = await supabase.from("email_berichten")
              .select("id", { count: "exact", head: true })
              .eq("partner_id", profile.partner_id!)
              .eq("is_gelezen", false)
              .eq("richting", "inkomend")
              .or(filter);
            return { count: r.count ?? 0 };
          })();
      const [n, t, b, l, e] = await Promise.all([
        supabase.from("notificaties").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("gelezen", false),
        supabase.from("helpdesk_ticket_taken").select("id", { count: "exact", head: true }).eq("toegewezen_aan", user.id).in("status", ["open", "in_behandeling"]),
        berichtenCountP,
        profile?.partner_id ? supabase.from("leads").select("id", { count: "exact", head: true }).eq("partner_id", profile.partner_id).eq("owner_user_id", user.id).in("lead_status", ["terugbellen", "geen_gehoor", "voicemail"]) : Promise.resolve({ count: 0 } as { count: number }),
        profile?.partner_id ? supabase.from("financiele_documenten").select("id", { count: "exact", head: true }).eq("partner_id", profile.partner_id).eq("type", "verkoopfactuur").eq("status", "verzonden").lt("vervaldatum", today) : Promise.resolve({ count: 0 } as { count: number }),
      ]);
      return (n.count ?? 0) + (t.count ?? 0) + (b.count ?? 0) + (l.count ?? 0) + (e.count ?? 0);
    },
  });
}