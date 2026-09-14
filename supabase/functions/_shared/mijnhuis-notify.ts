// Gedeelde helper: stuurt een interne melding naar het mijnhuis.nu-postvak
// (standaard info@mijnhuis.nu) en zet optioneel een afspraak in dezelfde
// Google-agenda. Beide stappen falen zacht: de aanroepende functie blijft
// werken als mail of agenda tijdelijk niet beschikbaar is.

import { sendUserEmail } from "./user-email-send.ts";
import { gcalFetch, type GoogleAccount } from "./google-calendar.ts";

export const NOTIFY_ADDRESS = Deno.env.get("MIJNHUIS_NOTIFY_EMAIL") ?? "info@mijnhuis.nu";

export interface AgendaAfspraak {
  titel: string;
  omschrijving: string;
  startIso: string;
  duurMinuten: number;
  gastEmail?: string | null;
}

export interface NotifyParams {
  adminClient: any;
  subject: string;
  html: string;
  afspraak?: AgendaAfspraak | null;
}

export interface NotifyResult {
  mail: "verzonden" | "mislukt";
  agenda: "aangemaakt" | "mislukt" | "overgeslagen";
}

async function mailAccount(adminClient: any) {
  const { data } = await adminClient
    .from("email_accounts")
    .select("user_id, partner_id")
    .eq("email_adres", NOTIFY_ADDRESS)
    .eq("actief", true)
    .limit(1)
    .maybeSingle();
  return data as { user_id: string; partner_id: string } | null;
}

async function agendaAccount(adminClient: any) {
  const { data } = await adminClient
    .from("google_calendar_accounts")
    .select("*")
    .eq("google_email", NOTIFY_ADDRESS)
    .eq("actief", true)
    .limit(1)
    .maybeSingle();
  return (data ?? null) as GoogleAccount | null;
}

async function maakAgendaItem(adminClient: any, afspraak: AgendaAfspraak): Promise<boolean> {
  const account = await agendaAccount(adminClient);
  if (!account) return false;
  const start = new Date(afspraak.startIso);
  const eind = new Date(start.getTime() + afspraak.duurMinuten * 60_000);
  const body: Record<string, unknown> = {
    summary: afspraak.titel,
    description: afspraak.omschrijving,
    start: { dateTime: start.toISOString(), timeZone: "Europe/Amsterdam" },
    end: { dateTime: eind.toISOString(), timeZone: "Europe/Amsterdam" },
  };
  if (afspraak.gastEmail) body.attendees = [{ email: afspraak.gastEmail }];
  const resp = await gcalFetch(
    account,
    `/calendars/${encodeURIComponent(account.calendar_id || "primary")}/events?sendUpdates=all`,
    { method: "POST", body: JSON.stringify(body) },
  );
  if (!resp.ok) {
    console.error("Agenda-item mislukt:", resp.status, await resp.text());
    return false;
  }
  return true;
}

/** Stuurt de melding en plant optioneel de afspraak. Gooit nooit. */
export async function notifyMijnhuis(params: NotifyParams): Promise<NotifyResult> {
  const { adminClient, subject, html, afspraak = null } = params;
  const result: NotifyResult = { mail: "mislukt", agenda: afspraak ? "mislukt" : "overgeslagen" };

  try {
    const account = await mailAccount(adminClient);
    if (!account) throw new Error(`Geen actief mailaccount voor ${NOTIFY_ADDRESS}`);
    await sendUserEmail({
      adminClient,
      userId: account.user_id,
      partnerId: account.partner_id,
      to: NOTIFY_ADDRESS,
      subject,
      html,
      type: "intern",
    });
    result.mail = "verzonden";
  } catch (err) {
    console.error("Interne melding mislukt:", err);
  }

  if (afspraak) {
    try {
      result.agenda = (await maakAgendaItem(adminClient, afspraak)) ? "aangemaakt" : "mislukt";
    } catch (err) {
      console.error("Agenda-afspraak mislukt:", err);
    }
  }

  return result;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function regelsHtml(rows: Array<[string, unknown]>): string {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `<p style="margin:4px 0"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`)
    .join("");
}
