import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { adminClient, corsHeaders, gcalFetch, GoogleAccount } from "../_shared/google-calendar.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Niet ingelogd" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Sessie ongeldig" }, 401);

    const admin = adminClient();
    const { data: account } = await admin
      .from("google_calendar_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!account) return json({ ok: true });

    // Stop webhook channel (best-effort)
    if (account.channel_id && account.resource_id) {
      try {
        await gcalFetch(account as GoogleAccount, "/channels/stop", {
          method: "POST",
          body: JSON.stringify({ id: account.channel_id, resourceId: account.resource_id }),
        });
      } catch (e) { console.warn("Channel stop fout", e); }
    }

    // Revoke refresh token bij Google (best-effort)
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${account.refresh_token}`, { method: "POST" });
    } catch (e) { console.warn("Revoke fout", e); }

    // Verwijder mapping en account
    await admin.from("google_calendar_event_mapping").delete().eq("user_id", user.id);
    await admin.from("google_calendar_accounts").delete().eq("user_id", user.id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}