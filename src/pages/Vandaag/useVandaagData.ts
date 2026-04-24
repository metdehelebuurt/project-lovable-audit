import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiecentrum } from "@/hooks/useActiecentrum";

export type RecentItemType = "lead" | "offerte" | "schouw" | "installatie" | "ticket";

export interface VandaagAfspraak {
  id: string;
  titel: string;
  start_tijd: string | null;
  eind_tijd: string | null;
  type: string;
  locatie: string | null;
  klant_naam: string | null;
}

export interface VandaagRecentItem {
  id: string;
  type: RecentItemType;
  label: string;
  status: string;
  datum: string;
  url: string;
}

/**
 * Verzamelt data voor de /vandaag pagina: agenda, recente activiteit en
 * actiecentrum-counts. Houdt het aantal queries klein door per rol te filteren.
 */
export function useVandaagData() {
  const { user, profile } = useAuth();
  const partnerId = profile?.partner_id;
  const userId = user?.id;
  const rol = profile?.rol;

  const ac = useActiecentrum();

  const agenda = useQuery({
    queryKey: ["vandaag-agenda", userId, partnerId],
    enabled: !!partnerId && !!userId,
    queryFn: async (): Promise<VandaagAfspraak[]> => {
      const today = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("afspraken")
        .select("id, titel, start_tijd, eind_tijd, type, locatie, klanten(voornaam, achternaam)")
        .eq("partner_id", partnerId!)
        .eq("datum", today)
        .order("start_tijd", { ascending: true, nullsFirst: false });
      // Adviseur/installateur: alleen eigen afspraken
      if (rol === "adviseur" || rol === "installateur") {
        q = q.eq("adviseur_id", userId!);
      }
      const { data } = await q.limit(20);
      return (data ?? []).map((r) => {
        const k = r.klanten as { voornaam?: string | null; achternaam?: string | null } | null;
        const naam = k ? `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() : null;
        return {
          id: r.id,
          titel: r.titel,
          start_tijd: r.start_tijd,
          eind_tijd: r.eind_tijd,
          type: r.type,
          locatie: r.locatie,
          klant_naam: naam || null,
        };
      });
    },
  });

  const recent = useQuery({
    queryKey: ["vandaag-recent", partnerId, rol],
    enabled: !!partnerId,
    queryFn: async (): Promise<VandaagRecentItem[]> => {
      const items: VandaagRecentItem[] = [];
      const isVerkoop = ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"].includes(rol ?? "");
      const isUitvoer = ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"].includes(rol ?? "");

      const [leads, offertes, installaties, tickets] = await Promise.all([
        isVerkoop
          ? supabase.from("leads").select("id, voornaam, achternaam, lead_status, updated_at")
              .eq("partner_id", partnerId!).order("updated_at", { ascending: false }).limit(4)
          : Promise.resolve({ data: [] }),
        isVerkoop
          ? supabase.from("offertes").select("id, offertenummer, klant_naam, status, updated_at")
              .eq("partner_id", partnerId!).order("updated_at", { ascending: false }).limit(4)
          : Promise.resolve({ data: [] }),
        isUitvoer
          ? supabase.from("installaties").select("id, installatienummer, consument_naam, status, updated_at")
              .eq("partner_id", partnerId!).order("updated_at", { ascending: false }).limit(4)
          : Promise.resolve({ data: [] }),
        supabase.from("helpdesk_tickets").select("id, ticketnummer, titel, status, updated_at")
          .eq("partner_id", partnerId!).order("updated_at", { ascending: false }).limit(3),
      ]);

      (leads.data ?? []).forEach((l) => items.push({
        id: l.id, type: "lead",
        label: `${l.voornaam ?? ""} ${l.achternaam ?? ""}`.trim() || "Lead",
        status: l.lead_status ?? "", datum: l.updated_at, url: `/leads/${l.id}`,
      }));
      (offertes.data ?? []).forEach((o) => items.push({
        id: o.id, type: "offerte",
        label: o.klant_naam || o.offertenummer || "Offerte",
        status: o.status, datum: o.updated_at, url: `/offertes/${o.id}`,
      }));
      (installaties.data ?? []).forEach((i) => items.push({
        id: i.id, type: "installatie",
        label: i.consument_naam || i.installatienummer || "Installatie",
        status: i.status, datum: i.updated_at, url: `/installaties/${i.id}`,
      }));
      (tickets.data ?? []).forEach((t) => items.push({
        id: t.id, type: "ticket",
        label: t.titel || t.ticketnummer || "Ticket",
        status: t.status, datum: t.updated_at, url: `/helpdesk/tickets/${t.id}`,
      }));

      return items
        .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
        .slice(0, 8);
    },
  });

  return {
    agenda: agenda.data ?? [],
    recent: recent.data ?? [],
    actiecentrum: ac.counts,
    isLoading: agenda.isLoading || recent.isLoading || ac.isLoading,
  };
}