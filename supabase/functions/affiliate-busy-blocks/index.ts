// Edge function: bezet-blokken van affiliate-agenda's voor sales-managers
// Alleen sales_admin (superadmin of sales_manager) mag aanroepen.
// Returnt per affiliate alleen { start, end } — geen titel, locatie of deelnemers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, adminClient, ensureAccessToken, type GoogleAccount } from "../_shared/google-calendar.ts";

interface ReqBody {
  affiliate_ids: string[];
  from: string; // ISO datetime
  to: string;   // ISO datetime
}

interface BusyBlock { start: string; end: string }

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isIso(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

async function freeBusyForAccount(
  account: GoogleAccount,
  from: string,
  to: string,
): Promise<BusyBlock[]> {
  const token = await ensureAccessToken(account);
  const resp = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: from,
      timeMax: to,
      timeZone: "Europe/Amsterdam",
      items: [{ id: account.calendar_id || "primary" }],
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Google freeBusy ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  const cal = data?.calendars?.[account.calendar_id || "primary"];
  if (!cal) return [];
  if (cal.errors?.length) {
    throw new Error(`Google freeBusy fout: ${cal.errors[0]?.reason || "onbekend"}`);
  }
  return (cal.busy ?? []).map((b: { start: string; end: string }) => ({
    start: b.start,
    end: b.end,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identificeer caller en check rol via security-definer is_sales_admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const admin = adminClient();
    const { data: rolCheck } = await admin
      .from("users")
      .select("rol")
      .eq("id", callerId)
      .maybeSingle();
    const rol = rolCheck?.rol;
    if (rol !== "superadmin" && rol !== "sales_manager") {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<ReqBody>;
    if (!Array.isArray(body.affiliate_ids) || !isIso(body.from) || !isIso(body.to)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ids = body.affiliate_ids.filter(isUuid).slice(0, 50);
    if (ids.length === 0) {
      return new Response(JSON.stringify({ result: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Haal Google-accounts in één query
    const { data: accounts, error: accErr } = await admin
      .from("google_calendar_accounts")
      .select(
        "id, user_id, partner_id, google_email, calendar_id, access_token, refresh_token, token_expiry, sync_token, channel_id, resource_id, channel_expiry, sync_schouwen, sync_installaties, sync_afspraken, sync_taken, sync_handmatig, actief",
      )
      .in("user_id", ids)
      .eq("actief", true);
    if (accErr) throw accErr;

    const result: Record<string, { busy: BusyBlock[]; error?: string; linked: boolean }> = {};
    for (const id of ids) result[id] = { busy: [], linked: false };

    // Parallel ophalen, maar gebufferd op 5 tegelijk om rate-limits te respecteren
    const tasks = (accounts ?? []).map((acc) => async () => {
      try {
        const blocks = await freeBusyForAccount(acc as GoogleAccount, body.from!, body.to!);
        result[acc.user_id] = { busy: blocks, linked: true };
      } catch (e) {
        result[acc.user_id] = {
          busy: [],
          linked: true,
          error: e instanceof Error ? e.message : "onbekende fout",
        };
      }
    });
    const concurrency = 5;
    for (let i = 0; i < tasks.length; i += concurrency) {
      await Promise.all(tasks.slice(i, i + concurrency).map((t) => t()));
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "internal", message: e instanceof Error ? e.message : "onbekend" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});