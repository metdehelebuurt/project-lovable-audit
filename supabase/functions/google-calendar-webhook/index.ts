// Ontvangt push-notificaties van Google en triggert een pull voor het betreffende account
import { adminClient, corsHeaders } from "../_shared/google-calendar.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceState = req.headers.get("x-goog-resource-state");

    if (!channelId) return new Response("ok", { status: 200 });
    if (resourceState === "sync") return new Response("ok", { status: 200 }); // initial sync ping

    const admin = adminClient();
    const { data: account } = await admin
      .from("google_calendar_accounts")
      .select("user_id")
      .eq("channel_id", channelId)
      .maybeSingle();

    if (account) {
      // Asynchroon pull triggeren
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-sync-pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ user_id: account.user_id }),
      }).catch((e) => console.error("Pull trigger fout", e));
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("webhook fout", e);
    return new Response("err", { status: 200 }); // 200 om retries te voorkomen
  }
});