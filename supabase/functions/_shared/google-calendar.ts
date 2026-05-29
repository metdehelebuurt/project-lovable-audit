// Gedeelde helpers voor Google Calendar edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
  "profile",
].join(" ");

export const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/google-calendar-oauth-callback`;

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// HMAC-signed state token (CSRF protection)
const encoder = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, "");
}

export async function signState(userId: string, returnTo: string): Promise<string> {
  const payload = `${userId}|${Date.now()}|${returnTo}`;
  const sig = await hmac(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, payload);
  return btoa(payload).replace(/=+$/, "") + "." + sig;
}

export async function verifyState(token: string): Promise<{ userId: string; returnTo: string } | null> {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const payload = atob(payloadB64);
    const expected = await hmac(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, payload);
    if (expected !== sig) return null;
    const [userId, tsStr, returnTo] = payload.split("|");
    if (Date.now() - Number(tsStr) > 10 * 60 * 1000) return null; // 10 min
    return { userId, returnTo: returnTo || "/instellingen" };
  } catch {
    return null;
  }
}

export interface GoogleAccount {
  id: string;
  user_id: string;
  partner_id: string;
  google_email: string;
  calendar_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  sync_token: string | null;
  channel_id: string | null;
  resource_id: string | null;
  channel_expiry: string | null;
  sync_schouwen: boolean;
  sync_installaties: boolean;
  sync_afspraken: boolean;
  sync_taken: boolean;
  sync_handmatig: boolean;
  actief: boolean;
}

// Refresh access token als verlopen, retourneer geldige token
export async function ensureAccessToken(account: GoogleAccount): Promise<string> {
  if (new Date(account.token_expiry) > new Date(Date.now() + 30_000)) {
    return account.access_token;
  }
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    throw new Error(`Token refresh mislukt: ${JSON.stringify(data)}`);
  }
  const expiry = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
  await adminClient()
    .from("google_calendar_accounts")
    .update({ access_token: data.access_token, token_expiry: expiry })
    .eq("id", account.id);
  account.access_token = data.access_token;
  account.token_expiry = expiry;
  return data.access_token;
}

export async function gcalFetch(
  account: GoogleAccount,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await ensureAccessToken(account);
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, { ...init, headers });
}

// Bouw Google event payload uit platform entiteit
export interface EntiteitData {
  type: "schouw" | "installatie" | "afspraak" | "taak";
  id: string;
  partner_id: string;
  titel: string;
  beschrijving?: string;
  locatie?: string;
  datum: string; // ISO date or datetime
  start_tijd?: string | null; // HH:MM(:SS)
  eind_tijd?: string | null;
  eind_datum?: string | null;
  status?: string;
}

export function buildEventBody(d: EntiteitData): Record<string, unknown> {
  const allDay = !d.start_tijd;
  const startDate = d.datum.slice(0, 10);
  const endDate = d.eind_datum?.slice(0, 10) || startDate;

  const start = allDay
    ? { date: startDate }
    : { dateTime: `${startDate}T${normaliseerTijd(d.start_tijd!)}:00`, timeZone: "Europe/Amsterdam" };

  const end = allDay
    ? { date: addDays(endDate, 1) } // Google all-day end is exclusive
    : {
      dateTime: `${endDate}T${normaliseerTijd(d.eind_tijd || addUur(d.start_tijd!))}:00`,
      timeZone: "Europe/Amsterdam",
    };

  return {
    summary: d.titel,
    description: [d.beschrijving, `\n— Mijnhuis.nu (${d.type} ${d.id.slice(0, 8)})`]
      .filter(Boolean).join(""),
    location: d.locatie || undefined,
    start, end,
    extendedProperties: {
      private: {
        mijnhuis_type: d.type,
        mijnhuis_id: d.id,
        mijnhuis_partner: d.partner_id,
      },
    },
  };
}

function normaliseerTijd(t: string): string {
  // Accept HH:MM or HH:MM:SS
  return t.length === 5 ? t : t.slice(0, 5);
}

function addUur(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const nh = (h + 1) % 24;
  return `${String(nh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function hashEntiteit(d: EntiteitData): Promise<string> {
  const buf = encoder.encode(JSON.stringify(d));
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}