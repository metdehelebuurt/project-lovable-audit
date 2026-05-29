import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  GOOGLE_SCOPES,
  REDIRECT_URI,
  signState,
} from "../_shared/google-calendar.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Niet ingelogd" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Sessie ongeldig" }, 401);

    const body = await req.json().catch(() => ({}));
    const returnTo = typeof body.return_to === "string" ? body.return_to : "/instellingen";
    const state = await signState(user.id, returnTo);

    const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
    if (!clientId) return json({ error: "Google Calendar niet geconfigureerd" }, 500);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}