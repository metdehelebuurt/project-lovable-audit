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
    return renderResultPage({
      success: true,
      title: "E-mail gekoppeld",
      message: `Je e-mailaccount ${tokenData.email} is succesvol gekoppeld.`,
      provider,
      email: tokenData.email,
      fallback,
    });

  } catch (err) {
    console.error("OAuth callback error:", err);
    return renderResultPage({
      success: false,
      title: "Koppelen mislukt",
      message: err instanceof Error ? err.message : "Er ging iets mis bij het koppelen.",
      fallback: "/instellingen",
    });
  }
});

function redirectWithMessage(msg: string, isError: boolean) {
  return renderResultPage({
    success: !isError,
    title: isError ? "Koppelen mislukt" : "Gelukt",
    message: msg,
    fallback: "/instellingen",
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function renderResultPage(opts: {
  success: boolean;
  title: string;
  message: string;
  provider?: string;
  email?: string;
  fallback: string;
}) {
  const { success, title, message, provider = "", email = "", fallback } = opts;
  const icon = success
    ? `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
    : `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  const accent = success ? "#16a34a" : "#dc2626";
  const bgTint = success ? "#f0fdf4" : "#fef2f2";
  const payload = JSON.stringify({
    type: "email-oauth-result",
    error: !success,
    provider,
    email,
    message,
  });
  const fallbackJson = JSON.stringify(fallback);
  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
    color: #1f2937;
    padding: 24px;
  }
  .card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 60px -20px rgba(88, 28, 135, 0.25);
    padding: 40px 36px;
    max-width: 420px;
    width: 100%;
    text-align: center;
    border: 1px solid #ede9fe;
  }
  .icon-wrap {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: ${bgTint};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  h1 { font-size: 22px; font-weight: 600; margin: 0 0 8px; color: #111827; }
  p  { font-size: 14px; line-height: 1.55; color: #4b5563; margin: 0 0 24px; }
  .email { font-weight: 500; color: ${accent}; word-break: break-all; }
  .btn {
    display: inline-block;
    background: #7c3aed;
    color: #ffffff;
    text-decoration: none;
    padding: 11px 22px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    border: 0;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .btn:hover { background: #6d28d9; }
  .hint { margin-top: 16px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">${icon}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <button class="btn" onclick="closeOrRedirect()">Venster sluiten</button>
    <div class="hint">Dit venster sluit automatisch…</div>
  </div>
<script>
  (function () {
    var payload = ${payload};
    var fallback = ${fallbackJson};
    function closeOrRedirect() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*');
          window.close();
          setTimeout(function(){ window.location.replace(fallback); }, 300);
        } else {
          window.location.replace(fallback);
        }
      } catch (e) {
        window.location.replace(fallback);
      }
    }
    window.closeOrRedirect = closeOrRedirect;
    setTimeout(closeOrRedirect, 1500);
  })();
</script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
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
