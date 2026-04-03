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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const { to, subject, html_body, offerte_id, lead_id, klant_id } = body;

    if (!to || !subject || !html_body) {
      return new Response(JSON.stringify({ error: "to, subject, html_body zijn verplicht" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userRow } = await adminClient.from("users").select("partner_id").eq("id", userId).single();
    if (!userRow?.partner_id) {
      return new Response(JSON.stringify({ error: "Geen partner gekoppeld" }), { status: 400, headers: corsHeaders });
    }

    // Get email account
    const { data: emailAccount } = await adminClient
      .from("email_accounts")
      .select("*")
      .eq("partner_id", userRow.partner_id)
      .eq("actief", true)
      .single();

    if (!emailAccount) {
      return new Response(JSON.stringify({ error: "Geen e-mailaccount gekoppeld" }), { status: 400, headers: corsHeaders });
    }

    // Refresh token if needed
    let accessToken = emailAccount.access_token;
    if (new Date(emailAccount.token_expiry) <= new Date()) {
      accessToken = await refreshAccessToken(adminClient, emailAccount);
    }

    // Send via appropriate API
    if (emailAccount.provider === "google") {
      await sendViaGmail(accessToken, emailAccount.email_adres, to, subject, html_body);
    } else if (emailAccount.provider === "microsoft") {
      await sendViaMsGraph(accessToken, to, subject, html_body);
    }

    // Save to email_berichten
    await adminClient.from("email_berichten").insert({
      email_account_id: emailAccount.id,
      partner_id: userRow.partner_id,
      richting: "uitgaand",
      van: emailAccount.email_adres,
      aan: to,
      onderwerp: subject,
      body_html: html_body,
      datum: new Date().toISOString(),
      is_gelezen: true,
      lead_id: lead_id || null,
      klant_id: klant_id || null,
      offerte_id: offerte_id || null,
    });

    // Also log in email_log
    await adminClient.from("email_log").insert({
      partner_id: userRow.partner_id,
      offerte_id: offerte_id || null,
      ontvanger_email: to,
      onderwerp: subject,
      html_body: html_body,
      status: "verzonden",
      type: offerte_id ? "offerte" : "algemeen",
      verzonden_door_id: userId,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("email-api-send error:", err);
    return new Response(JSON.stringify({ error: err.message || "Interne fout" }), { status: 500, headers: corsHeaders });
  }
});

async function refreshAccessToken(adminClient: any, account: any): Promise<string> {
  let tokenUrl: string;
  let params: Record<string, string>;

  if (account.provider === "google") {
    tokenUrl = "https://oauth2.googleapis.com/token";
    params = {
      client_id: Deno.env.get("GOOGLE_EMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_EMAIL_CLIENT_SECRET")!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    };
  } else {
    tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    params = {
      client_id: Deno.env.get("MICROSOFT_EMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("MICROSOFT_EMAIL_CLIENT_SECRET")!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
      scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access",
    };
  }

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const data = await resp.json();
  if (data.error) throw new Error(`Token refresh failed: ${data.error_description || data.error}`);

  await adminClient.from("email_accounts").update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    updated_at: new Date().toISOString(),
  }).eq("id", account.id);

  return data.access_token;
}

async function sendViaGmail(accessToken: string, from: string, to: string, subject: string, html: string) {
  const rawMessage = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
  ].join("\r\n");

  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`Gmail send failed: ${JSON.stringify(err)}`);
  }
}

async function sendViaMsGraph(accessToken: string, to: string, subject: string, html: string) {
  const resp = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Graph send failed: ${err}`);
  }
}
