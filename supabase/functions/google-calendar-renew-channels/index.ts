// Cron: hernieuw of activeer webhook-channels die binnen 24u verlopen of nog niet bestaan
import { adminClient, corsHeaders, gcalFetch, GoogleAccount } from "../_shared/google-calendar.ts";

const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-webhook`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = adminClient();
    const grens = new Date(Date.now() + 24 * 3600_000).toISOString();
    const { data: accounts } = await admin
      .from("google_calendar_accounts")
      .select("*")
      .eq("actief", true)
      .or(`channel_expiry.is.null,channel_expiry.lt.${grens}`);

    let vernieuwd = 0;
    for (const account of accounts || []) {
      try {
        await vernieuwChannel(admin, account as GoogleAccount);
        vernieuwd++;
      } catch (e) { console.error(`Channel vernieuwen ${account.id} fout`, e); }
    }
    return new Response(JSON.stringify({ ok: true, vernieuwd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function vernieuwChannel(admin: ReturnType<typeof adminClient>, account: GoogleAccount) {
  // Stop oude channel best-effort
  if (account.channel_id && account.resource_id) {
    try {
      await gcalFetch(account, "/channels/stop", {
        method: "POST",
        body: JSON.stringify({ id: account.channel_id, resourceId: account.resource_id }),
      });
    } catch { /* negeer */ }
  }

  const newChannelId = crypto.randomUUID();
  const resp = await gcalFetch(
    account,
    `/calendars/${encodeURIComponent(account.calendar_id)}/events/watch`,
    {
      method: "POST",
      body: JSON.stringify({
        id: newChannelId,
        type: "web_hook",
        address: WEBHOOK_URL,
        expiration: String(Date.now() + 6 * 86400_000), // 6 dagen
      }),
    },
  );
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Watch fout ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  await admin.from("google_calendar_accounts").update({
    channel_id: data.id,
    resource_id: data.resourceId,
    channel_expiry: new Date(Number(data.expiration)).toISOString(),
  }).eq("id", account.id);
}