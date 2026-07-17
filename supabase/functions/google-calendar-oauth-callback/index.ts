import {
  adminClient,
  corsHeaders,
  REDIRECT_URI,
  verifyState,
} from "../_shared/google-calendar.ts";

const APP_URL = "https://app.mijnhuis.nu";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return redirectMet(`${APP_URL}/instellingen?gcal=denied`);
  }
  if (!code || !state) {
    return redirectMet(`${APP_URL}/instellingen?gcal=invalid`);
  }

  const verified = await verifyState(state);
  if (!verified) {
    return redirectMet(`${APP_URL}/instellingen?gcal=expired`);
  }

  try {
    // Wissel code voor tokens
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokens = await tokenResp.json();
    if (!tokenResp.ok || !tokens.access_token || !tokens.refresh_token) {
      console.error("Token exchange mislukt", tokens);
      return redirectMet(`${APP_URL}/instellingen?gcal=token_error`);
    }

    // Haal email op
    const userinfo = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());

    const admin = adminClient();

    // Haal partner_id op
    const { data: userRow } = await admin
      .from("users")
      .select("partner_id")
      .eq("id", verified.userId)
      .single();
    if (!userRow?.partner_id) {
      return redirectMet(`${APP_URL}/instellingen?gcal=no_partner`);
    }

    const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // Meerdere Google-accounts per user toegestaan: match op (user_id, google_email).
    const { data: bestaand } = await admin
      .from("google_calendar_accounts")
      .select("id")
      .eq("user_id", verified.userId)
      .ilike("google_email", userinfo.email)
      .maybeSingle();

    const payload = {
      user_id: verified.userId,
      partner_id: userRow.partner_id,
      google_email: userinfo.email,
      calendar_id: "primary",
      calendar_summary: userinfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiry,
      scope: tokens.scope,
      actief: true,
      laatste_fout: null,
      sync_token: null,
    };

    if (bestaand?.id) {
      await admin.from("google_calendar_accounts").update(payload).eq("id", bestaand.id);
    } else {
      await admin.from("google_calendar_accounts").insert(payload);
    }

    return redirectMet(`${APP_URL}${verified.returnTo}?gcal=ok`);
  } catch (e) {
    console.error("Callback fout", e);
    return redirectMet(`${APP_URL}/instellingen?gcal=error`);
  }
});

function redirectMet(url: string) {
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url } });
}