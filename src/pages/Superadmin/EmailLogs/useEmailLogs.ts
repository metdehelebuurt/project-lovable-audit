import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Bron = "platform" | "partner" | "inbox";

export interface EmailRow {
  id: string;
  bron: Bron;
  datum: string;
  type: string;
  van: string | null;
  naar: string;
  status: string;
  error: string | null;
  partner_id: string | null;
  partner_naam: string | null;
  verzonden_door: string | null;
  html_preview: string | null;
  message_id: string | null;
}

export interface FilterState {
  range: "24h" | "7d" | "30d" | "all";
  type: string | "all";
  status: string | "all";
  search: string;
}

function rangeStart(range: FilterState["range"]): string | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 86_400_000).toISOString();
  if (range === "7d") return new Date(now - 7 * 86_400_000).toISOString();
  if (range === "30d") return new Date(now - 30 * 86_400_000).toISOString();
  return null;
}

/** Platform-mails: Lovable Email (gededupliceerd op message_id, laatste status). */
export function usePlatformLogs(filter: FilterState) {
  return useQuery({
    queryKey: ["email-logs-platform", filter],
    queryFn: async (): Promise<EmailRow[]> => {
      let q = supabase
        .from("email_send_log")
        .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const start = rangeStart(filter.range);
      if (start) q = q.gte("created_at", start);
      if (filter.type !== "all") q = q.eq("template_name", filter.type);
      if (filter.status !== "all") q = q.eq("status", filter.status);
      if (filter.search) q = q.ilike("recipient_email", `%${filter.search}%`);
      const { data, error } = await q;
      if (error) throw error;

      // Dedupliceer op message_id (laatste rij per id wint, lijst is al desc).
      const seen = new Set<string>();
      const rows: EmailRow[] = [];
      for (const r of data ?? []) {
        const key = r.message_id ?? r.id;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          id: r.id,
          bron: "platform",
          datum: r.created_at,
          type: r.template_name ?? "platform",
          van: "Platform (Lovable Email)",
          naar: r.recipient_email,
          status: r.status,
          error: r.error_message,
          partner_id: null,
          partner_naam: null,
          verzonden_door: "Platform",
          html_preview: null,
          message_id: r.message_id,
        });
      }
      return rows;
    },
  });
}

/** Partner-mails: alle mails die via een partner-account naar buiten gingen (offerte, factuur, helpdesk-notify, …). */
export function usePartnerLogs(filter: FilterState) {
  return useQuery({
    queryKey: ["email-logs-partner", filter],
    queryFn: async (): Promise<EmailRow[]> => {
      let q = supabase
        .from("email_log")
        .select(
          "id, type, status, ontvanger_email, onderwerp, html_body, error_message, created_at, partner_id, verzonden_door_id, partners(naam), users:verzonden_door_id(naam, email)",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      const start = rangeStart(filter.range);
      if (start) q = q.gte("created_at", start);
      if (filter.type !== "all") q = q.eq("type", filter.type);
      if (filter.status !== "all") q = q.eq("status", filter.status);
      if (filter.search) q = q.ilike("ontvanger_email", `%${filter.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => {
        const u = (r as any).users as { naam?: string; email?: string } | null;
        const p = (r as any).partners as { naam?: string } | null;
        const verzondenDoor = u?.naam
          ? `${u.naam}${u.email ? ` <${u.email}>` : ""}`
          : p?.naam
          ? `${p.naam} (organisatie)`
          : "Onbekend";
        return {
          id: r.id,
          bron: "partner" as const,
          datum: r.created_at,
          type: r.type ?? "onbekend",
          van: verzondenDoor,
          naar: r.ontvanger_email,
          status: r.status,
          error: r.error_message,
          partner_id: r.partner_id,
          partner_naam: p?.naam ?? null,
          verzonden_door: verzondenDoor,
          html_preview: r.html_body ?? null,
          message_id: null,
        };
      });
    },
  });
}

/** Gebruiker-mailbox heen-en-weer (Gmail/Outlook OAuth sync). */
export function useInboxLogs(filter: FilterState) {
  return useQuery({
    queryKey: ["email-logs-inbox", filter],
    queryFn: async (): Promise<EmailRow[]> => {
      let q = supabase
        .from("email_berichten")
        .select("id, datum, richting, van, aan, onderwerp, body_html, partner_id, partners(naam)")
        .order("datum", { ascending: false })
        .limit(500);
      const start = rangeStart(filter.range);
      if (start) q = q.gte("datum", start);
      if (filter.type !== "all") q = q.eq("richting", filter.type);
      if (filter.search) q = q.or(`aan.ilike.%${filter.search}%,van.ilike.%${filter.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => {
        const p = (r as any).partners as { naam?: string } | null;
        return {
          id: r.id,
          bron: "inbox" as const,
          datum: r.datum,
          type: r.richting,
          van: r.van,
          naar: r.aan,
          status: r.richting === "uitgaand" ? "verzonden" : "ontvangen",
          error: null,
          partner_id: r.partner_id,
          partner_naam: p?.naam ?? null,
          verzonden_door: p?.naam ? `${p.naam} (mailbox)` : null,
          html_preview: r.body_html ?? null,
          message_id: null,
        };
      });
    },
  });
}