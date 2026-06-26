import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TijdlijnType =
  | "contactmoment"
  | "mail_in"
  | "mail_uit"
  | "ai_opvolg"
  | "status"
  | "veld";

export interface TijdlijnItem {
  id: string;
  type: TijdlijnType;
  datum: string;
  titel: string;
  subtitel?: string | null;
  body?: string | null;
  actor?: string | null;
  meta?: Record<string, string | null | undefined>;
}

interface Args {
  leadId: string | undefined;
  email?: string | null;
}

/** Merged activiteiten-stream voor één affiliate-lead. */
export function useLeadTijdlijn({ leadId, email }: Args) {
  return useQuery({
    enabled: !!leadId,
    queryKey: ["affiliate-lead-tijdlijn", leadId, email ?? ""],
    queryFn: async (): Promise<TijdlijnItem[]> => {
      const [contact, opvolg, historie, mails] = await Promise.all([
        supabase
          .from("affiliate_lead_contactmomenten")
          .select("id,created_at,type,uitkomst,notitie")
          .eq("lead_id", leadId!)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("affiliate_opvolg_log")
          .select("id,created_at,actie,titel,bron,details")
          .eq("lead_id", leadId!)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("entiteit_historie")
          .select("id,created_at,actie,veld,oude_waarde,nieuwe_waarde,actor_naam")
          .eq("entiteit_type", "affiliate_lead")
          .eq("entiteit_id", leadId!)
          .order("created_at", { ascending: false })
          .limit(50),
        email
          ? supabase
              .from("email_berichten")
              .select("id,datum,onderwerp,richting,van,aan,body_text")
              .or(`affiliate_lead_id.eq.${leadId},aan.eq.${email},van.eq.${email}`)
              .order("datum", { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [], error: null } as const),
      ]);

      const items: TijdlijnItem[] = [];

      (contact.data ?? []).forEach((c) => {
        items.push({
          id: `c-${c.id}`,
          type: "contactmoment",
          datum: c.created_at,
          titel: contactTitel(c.type, c.uitkomst),
          subtitel: c.uitkomst ?? null,
          body: c.notitie,
        });
      });

      (opvolg.data ?? []).forEach((o) => {
        const details = (o.details ?? null) as Record<string, unknown> | null;
        const samenvatting = typeof details?.samenvatting === "string" ? details.samenvatting : null;
        items.push({
          id: `o-${o.id}`,
          type: "ai_opvolg",
          datum: o.created_at,
          titel: o.titel || opvolgTitel(o.actie),
          subtitel: o.bron ?? null,
          body: samenvatting,
        });
      });

      (historie.data ?? []).forEach((h) => {
        items.push({
          id: `h-${h.id}`,
          type: h.actie === "status_gewijzigd" ? "status" : "veld",
          datum: h.created_at,
          titel: historieTitel(h.actie, h.veld),
          subtitel: h.actor_naam,
          body:
            h.oude_waarde || h.nieuwe_waarde
              ? `${h.oude_waarde ?? "—"} → ${h.nieuwe_waarde ?? "—"}`
              : null,
        });
      });

      (mails.data ?? []).forEach((m) => {
        const isIn = m.richting === "in" || m.richting === "inkomend";
        items.push({
          id: `m-${m.id}`,
          type: isIn ? "mail_in" : "mail_uit",
          datum: m.datum,
          titel: m.onderwerp || (isIn ? "Inkomende mail" : "Uitgaande mail"),
          subtitel: isIn ? `Van ${m.van}` : `Aan ${m.aan}`,
          body: m.body_text ? m.body_text.slice(0, 280) : null,
        });
      });

      items.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
      return items;
    },
  });
}

function contactTitel(type: string | null, uitkomst: string | null): string {
  const t = (type ?? "notitie").toLowerCase();
  const label =
    t === "telefoon" ? "Telefoongesprek"
    : t === "whatsapp" ? "WhatsApp-bericht"
    : t === "mail" ? "E-mail gelogd"
    : t === "afspraak" ? "Afspraak"
    : "Contactmoment";
  return uitkomst ? `${label} · ${uitkomst}` : label;
}

function opvolgTitel(actie: string | null): string {
  const map: Record<string, string> = {
    suggestie_gegenereerd: "AI-opvolgsuggestie",
    mail_voorstel: "AI mail-voorstel",
    bel_voorstel: "AI bel-voorstel",
    automatisch_verzonden: "Automatische opvolging verzonden",
  };
  return map[actie ?? ""] ?? actie ?? "AI-actie";
}

function historieTitel(actie: string, veld: string | null): string {
  const map: Record<string, string> = {
    aangemaakt: "Lead aangemaakt",
    status_gewijzigd: "Status gewijzigd",
    eigenaar_gewijzigd: "Eigenaar gewijzigd",
    fase_gewijzigd: "Fase gewijzigd",
    temperatuur_gewijzigd: "Temperatuur gewijzigd",
    waarde_gewijzigd: "Waarde gewijzigd",
  };
  if (map[actie]) return map[actie];
  return veld ? `${veld} gewijzigd` : actie;
}