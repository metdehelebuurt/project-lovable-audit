import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return redirectWithMessage(`OAuth error: ${error}`, true);
    }

    if (!code || !state) {
      return new Response(JSON.stringify({ error: "Missing code or state" }), { status: 400, headers: corsHeaders });
    }

    // Decode state: base64 encoded JSON { partner_id, user_id, provider, redirect_url }
    let stateData: { partner_id: string; user_id: string; provider: string; redirect_url: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirectWithMessage("Invalid state parameter", true);
    }

    const { partner_id, user_id, provider, redirect_url } = stateData;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let tokenData: { access_token: string; refresh_token: string; expires_in: number; email: string; scopes: string[] };

    if (provider === "google") {
      tokenData = await exchangeGoogleToken(code, url.origin);
    } else if (provider === "microsoft") {
      tokenData = await exchangeMicrosoftToken(code, url.origin);
    } else {
      return redirectWithMessage("Unknown provider", true);
    }

    // Upsert email account
    const { error: dbError } = await adminClient.from("email_accounts").upsert({
      partner_id,
      user_id,
      provider,
      email_adres: tokenData.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scopes,
      actief: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "partner_id,provider" });

    if (dbError) {
      console.error("DB error:", dbError);
      return redirectWithMessage("Database error: " + dbError.message, true);
    }

    // Update partner email_provider
    await adminClient.from("partners").update({ email_provider: `oauth_${provider}` }).eq("id", partner_id);

    // Sluit de popup en informeer de opener. Als de flow niet in een popup
    // gebeurde (geen window.opener) valt het script terug op een redirect
    // naar de oorspronkelijke pagina met ?email_connected=<provider>.
    const returnUrl = redirect_url || "/instellingen";
    const separator = returnUrl.includes("?") ? "&" : "?";
    const fallback = `${returnUrl}${separator}email_connected=${provider}`;
    const safeEmail = (tokenData.email || "").replace(/'/g, "\\'");
    const html = `<!DOCTYPE html><html><body><script>
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'email-oauth-result', error: false, provider: '${provider}', email: '${safeEmail}', message: 'E-mail gekoppeld' }, '*');
          window.close();
        } else {
          window.location.replace(${JSON.stringify(fallback)});
        }
      } catch (e) {
        window.location.replace(${JSON.stringify(fallback)});
      }
    </script><p>E-mail gekoppeld — je kunt dit venster sluiten.</p></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });

  } catch (err) {
    console.error("OAuth callback error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});

function redirectWithMessage(msg: string, isError: boolean) {
  const html = `<!DOCTYPE html><html><body><script>
    window.opener?.postMessage({ type: 'email-oauth-result', error: ${isError}, message: '${msg.replace(/'/g, "\\'")}' }, '*');
    window.close();
  </script><p>${msg}</p></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

async function exchangeGoogleToken(code: string, origin: string) {
  const clientId = Deno.env.get("GOOGLE_EMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_EMAIL_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials niet geconfigureerd");

  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-oauth-callback`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = await tokenResp.json();
  if (tokenJson.error) throw new Error(tokenJson.error_description || tokenJson.error);

  // Get email address
  const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const userJson = await userResp.json();

  return {
    access_token: tokenJson.access_token,
    refresh_token: tokenJson.refresh_token || "",
    expires_in: tokenJson.expires_in || 3600,
    email: userJson.email,
    scopes: (tokenJson.scope || "").split(" "),
  };
}

async function exchangeMicrosoftToken(code: string, origin: string) {
  const clientId = Deno.env.get("MICROSOFT_EMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_EMAIL_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Microsoft OAuth credentials niet geconfigureerd");

  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-oauth-callback`;

  const tokenResp = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access",
    }),
  });

  const tokenJson = await tokenResp.json();
  if (tokenJson.error) throw new Error(tokenJson.error_description || tokenJson.error);

  // Get email
  const userResp = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const userJson = await userResp.json();

  return {
    access_token: tokenJson.access_token,
    refresh_token: tokenJson.refresh_token || "",
    expires_in: tokenJson.expires_in || 3600,
    email: userJson.mail || userJson.userPrincipalName,
    scopes: (tokenJson.scope || "").split(" "),
  };
}
