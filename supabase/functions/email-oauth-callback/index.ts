import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const updateAttempt = async (attemptId: string | null | undefined, patch: Record<string, unknown>) => {
    if (!attemptId) return;
    try {
      await adminClient.from("email_oauth_attempts").update({
        ...patch,
        updated_at: new Date().toISOString(),
      }).eq("id", attemptId);
    } catch (e) {
      console.error("Failed to update oauth attempt:", e);
    }
  };

  let attemptId: string | null = null;

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Decode state first so we can log attempt updates even on early errors.
    let stateData: { partner_id?: string | null; user_id: string; provider: string; redirect_url: string; attempt_id?: string; alias_email?: string };
    try {
      stateData = JSON.parse(atob(state || ""));
      attemptId = stateData.attempt_id || null;
    } catch {
      return redirectWithMessage("Invalid state parameter", true);
    }

    if (error) {
      const msg = errorDescription || error;
      await updateAttempt(attemptId, { status: "error", error_code: error, error_message: msg });
      return redirectWithMessage(`OAuth error: ${msg}`, true);
    }

    if (!code) {
      await updateAttempt(attemptId, { status: "error", error_code: "missing_code", error_message: "Geen autorisatiecode ontvangen" });
      return redirectWithMessage("Missing code", true);
    }

    const { partner_id, user_id, provider, redirect_url, alias_email } = stateData;

    let tokenData: { access_token: string; refresh_token: string; expires_in: number; email: string; scopes: string[] };

    if (provider === "google") {
      try {
        tokenData = await exchangeGoogleToken(code, url.origin);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updateAttempt(attemptId, { status: "error", error_code: "token_exchange_failed", error_message: msg });
        throw e;
      }
    } else if (provider === "microsoft") {
      try {
        tokenData = await exchangeMicrosoftToken(code, url.origin);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updateAttempt(attemptId, { status: "error", error_code: "token_exchange_failed", error_message: msg });
        throw e;
      }
    } else {
      await updateAttempt(attemptId, { status: "error", error_code: "unknown_provider", error_message: "Onbekende provider" });
      return redirectWithMessage("Unknown provider", true);
    }

    // Upsert email account — unique op (user_id, provider) zodat ook gebruikers
    // zonder partner (affiliates) hun account kunnen koppelen.
    const { error: dbError } = await adminClient.from("email_accounts").upsert({
      partner_id: partner_id || null,
      user_id,
      provider,
      email_adres: tokenData.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scopes,
      actief: true,
      needs_reauth: false,
      last_sync_error: null,
      last_sync_error_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });

    if (dbError) {
      console.error("DB error:", dbError);
      await updateAttempt(attemptId, { status: "error", error_code: "db_error", error_message: dbError.message, email_adres_resultaat: tokenData.email });
      return redirectWithMessage("Database error: " + dbError.message, true);
    }

    // Update partner email_provider — alleen als de gebruiker bij een partner hoort
    if (partner_id) {
      await adminClient.from("partners").update({ email_provider: `oauth_${provider}` }).eq("id", partner_id);
    }

    // Scope-check: als verplichte scopes ontbreken, waarschuw via de result-pagina.
    const required = provider === "google"
      ? ["gmail.send", "gmail.readonly"]
      : ["Mail.Send", "Mail.Read"];
    const granted = (tokenData.scopes || []).join(" ");
    const missing = required.filter((s) => !granted.toLowerCase().includes(s.toLowerCase()));
    if (missing.length > 0) {
      await updateAttempt(attemptId, {
        status: "error",
        error_code: "missing_scopes",
        error_message: `Mist scopes: ${missing.join(", ")}`,
        email_adres_resultaat: tokenData.email,
      });
      return renderResultPage({
        success: false,
        title: "Koppeling onvolledig",
        message: `Account ${tokenData.email} is gekoppeld, maar mist permissies: ${missing.join(", ")}. Koppel opnieuw en sta álle gevraagde rechten toe.`,
        provider,
        email: tokenData.email,
        fallback: redirect_url || "/instellingen",
      });
    }

    // Optionele Send-As alias toevoegen aan Gmail
    let aliasStatus: string | null = null;
    let aliasError: string | null = null;
    let aliasMessage = "";
    if (provider === "google" && alias_email && alias_email !== tokenData.email) {
      const grantedScopes = (tokenData.scopes || []).join(" ");
      if (!grantedScopes.includes("gmail.settings.sharing") && !grantedScopes.includes("gmail.settings.basic")) {
        aliasStatus = "scope_missing";
        aliasError = "Scope gmail.settings.sharing niet verleend. Herkoppel en accepteer alle rechten om Verzenden-als in te stellen.";
        aliasMessage = ` Het alias ${alias_email} is niet ingesteld: ${aliasError}`;
      } else {
        try {
          const sendAsResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sendAsEmail: alias_email, treatAsAlias: true }),
          });
          const sendAsJson = await sendAsResp.json().catch(() => ({}));
          if (!sendAsResp.ok) {
            aliasStatus = "failed";
            aliasError = sendAsJson?.error?.message || `Gmail API status ${sendAsResp.status}`;
            aliasMessage = ` Verzenden-als ${alias_email} kon niet worden ingesteld: ${aliasError}`;
          } else if (sendAsJson?.verificationStatus === "accepted") {
            aliasStatus = "verified";
            aliasMessage = ` Verzenden-als ${alias_email} is direct geactiveerd.`;
          } else {
            aliasStatus = "verification_sent";
            aliasMessage = ` Google heeft een verificatiemail gestuurd naar ${alias_email}. Klik op die link om Verzenden-als te activeren.`;
          }
        } catch (e) {
          aliasStatus = "failed";
          aliasError = e instanceof Error ? e.message : String(e);
          aliasMessage = ` Verzenden-als ${alias_email} kon niet worden ingesteld: ${aliasError}`;
        }
      }
    }

    await updateAttempt(attemptId, {
      status: "success",
      email_adres_resultaat: tokenData.email,
      alias_request: alias_email || null,
      alias_status: aliasStatus,
      alias_error: aliasError,
    });

    // Sluit de popup en informeer de opener. Als de flow niet in een popup
    // gebeurde (geen window.opener) valt het script terug op een redirect
    // naar de oorspronkelijke pagina met ?email_connected=<provider>.
    const returnUrl = redirect_url || "/instellingen";
    const separator = returnUrl.includes("?") ? "&" : "?";
    const fallback = `${returnUrl}${separator}email_connected=${provider}`;
    return renderResultPage({
      success: aliasStatus !== "failed" && aliasStatus !== "scope_missing",
      title: "E-mail gekoppeld",
      message: `Je e-mailaccount ${tokenData.email} is succesvol gekoppeld.${aliasMessage}`,
      provider,
      email: tokenData.email,
      fallback,
    });

  } catch (err) {
    console.error("OAuth callback error:", err);
    const msg = err instanceof Error ? err.message : "Er ging iets mis bij het koppelen.";
    await updateAttempt(attemptId, { status: "error", error_code: "exception", error_message: msg });
    return renderResultPage({
      success: false,
      title: "Koppelen mislukt",
      message: msg,
      fallback: "/instellingen",
    });
  }
});

function appOriginFromRedirect(redirectUrl: string | undefined): string {
  const fallback = "https://app.mijnhuis.nu";
  if (!redirectUrl) return fallback;
  try {
    const u = new URL(redirectUrl, fallback);
    return `${u.protocol}//${u.host}`;
  } catch {
    return fallback;
  }
}

function redirectWithMessage(msg: string, isError: boolean, redirectUrl?: string) {
  return renderResultPage({
    success: !isError,
    title: isError ? "Koppelen mislukt" : "Gelukt",
    message: msg,
    fallback: redirectUrl || "/instellingen",
  });
}

function renderResultPage(opts: {
  success: boolean;
  title?: string;
  message: string;
  provider?: string;
  email?: string;
  fallback: string;
  warning?: boolean;
}) {
  const { success, message, provider = "", email = "", fallback, warning } = opts;
  const origin = appOriginFromRedirect(fallback);
  const status = warning ? "warning" : (success ? "success" : "error");
  const params = new URLSearchParams({
    status,
    message,
    provider,
    email,
    fallback,
  });
  const target = `${origin}/oauth-return?${params.toString()}`;
  return new Response(null, {
    status: 302,
    headers: { Location: target },
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
