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
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Check if called with auth (manual sync) or without (cron)
    const authHeader = req.headers.get("Authorization");
    let userFilter: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      if (claimsData?.claims?.sub) {
        userFilter = claimsData.claims.sub as string;
      }
    }

    // Get active email accounts — bij manual sync alleen die van de ingelogde
    // gebruiker (werkt zowel voor partner-medewerkers als affiliates).
    let query = adminClient.from("email_accounts").select("*").eq("actief", true);
    if (userFilter) query = query.eq("user_id", userFilter);
    const { data: accounts } = await query;

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ synced: 0, message: "Geen actieve accounts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSynced = 0;

    for (const account of accounts) {
      try {
        // Refresh token if needed
        let accessToken = account.access_token;
        if (new Date(account.token_expiry) <= new Date()) {
          accessToken = await refreshToken(adminClient, account);
        }

        let messages: any[] = [];
        let newCursor: string | null = null;

        if (account.provider === "google") {
          const result = await syncGmail(accessToken, account.sync_cursor);
          messages = result.messages;
          newCursor = result.cursor;
        } else if (account.provider === "microsoft") {
          const result = await syncMsGraph(accessToken, account.sync_cursor);
          messages = result.messages;
          newCursor = result.cursor;
        }

        // Insert messages
        for (const msg of messages) {
          // Auto-match to lead/klant (partner) of affiliate_lead (affiliate)
          const { lead_id, klant_id, affiliate_lead_id } = await autoMatch(
            adminClient, account.partner_id, account.user_id, msg.from, msg.to,
          );

          await adminClient.from("email_berichten").upsert({
            email_account_id: account.id,
            partner_id: account.partner_id,
            user_id: account.user_id,
            provider_message_id: msg.id,
            richting: msg.from.toLowerCase().includes(account.email_adres.toLowerCase()) ? "uitgaand" : "inkomend",
            van: msg.from,
            aan: msg.to,
            onderwerp: msg.subject || "(geen onderwerp)",
            body_html: msg.body_html || null,
            body_text: msg.body_text || null,
            datum: msg.date,
            is_gelezen: msg.is_read,
            labels: msg.labels || [],
            lead_id,
            klant_id,
            affiliate_lead_id,
            thread_id: msg.thread_id || null,
            bijlagen: msg.attachments || [],
          }, { onConflict: "email_account_id,provider_message_id" });

          totalSynced++;
        }

        // Update cursor
        await adminClient.from("email_accounts").update({
          last_sync_at: new Date().toISOString(),
          ...(newCursor ? { sync_cursor: newCursor } : {}),
          updated_at: new Date().toISOString(),
        }).eq("id", account.id);

      } catch (err) {
        console.error(`Sync error for account ${account.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ synced: totalSynced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("email-api-sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});

async function refreshToken(adminClient: any, account: any): Promise<string> {
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
  if (data.error) throw new Error(`Refresh failed: ${data.error}`);

  await adminClient.from("email_accounts").update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
  }).eq("id", account.id);

  return data.access_token;
}

async function syncGmail(accessToken: string, cursor: string | null) {
  const messages: any[] = [];
  let newCursor = cursor;

  // If we have a cursor (historyId), use history API for incremental sync
  if (cursor) {
    try {
      const histResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${cursor}&historyTypes=messageAdded&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const histData = await histResp.json();
      newCursor = histData.historyId || cursor;

      const messageIds = new Set<string>();
      for (const h of histData.history || []) {
        for (const m of h.messagesAdded || []) {
          messageIds.add(m.message.id);
        }
      }

      for (const msgId of messageIds) {
        const msg = await getGmailMessage(accessToken, msgId);
        if (msg) messages.push(msg);
      }
    } catch {
      // Fallback to list
      return await syncGmailList(accessToken);
    }
  } else {
    return await syncGmailList(accessToken);
  }

  return { messages, cursor: newCursor };
}

async function syncGmailList(accessToken: string) {
  const messages: any[] = [];
  const listResp = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listResp.json();

  for (const item of (listData.messages || []).slice(0, 30)) {
    const msg = await getGmailMessage(accessToken, item.id);
    if (msg) messages.push(msg);
  }

  // Get current historyId for cursor
  const profileResp = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const profileData = await profileResp.json();

  return { messages, cursor: profileData.historyId || null };
}

async function getGmailMessage(accessToken: string, msgId: string) {
  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) return null;
  const data = await resp.json();

  const headers = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  let bodyHtml = "";
  let bodyText = "";

  function extractBody(part: any) {
    if (part.mimeType === "text/html" && part.body?.data) {
      bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
    if (part.parts) part.parts.forEach(extractBody);
  }
  extractBody(data.payload);

  return {
    id: data.id,
    thread_id: data.threadId,
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject"),
    date: new Date(parseInt(data.internalDate)).toISOString(),
    is_read: !(data.labelIds || []).includes("UNREAD"),
    labels: data.labelIds || [],
    body_html: bodyHtml,
    body_text: bodyText,
    attachments: (data.payload?.parts || [])
      .filter((p: any) => p.filename && p.body?.attachmentId)
      .map((p: any) => ({ naam: p.filename, grootte: p.body.size, id: p.body.attachmentId })),
  };
}

async function syncMsGraph(accessToken: string, cursor: string | null) {
  const messages: any[] = [];
  let url: string;

  if (cursor) {
    url = cursor; // deltaLink
  } else {
    url = "https://graph.microsoft.com/v1.0/me/messages?$top=30&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,isRead,body,hasAttachments";
  }

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error("Graph API error");
  const data = await resp.json();

  for (const msg of data.value || []) {
    messages.push({
      id: msg.id,
      thread_id: msg.conversationId || null,
      from: msg.from?.emailAddress ? `${msg.from.emailAddress.name || ""} <${msg.from.emailAddress.address}>` : "",
      to: (msg.toRecipients || []).map((r: any) => r.emailAddress?.address).join(", "),
      subject: msg.subject || "",
      date: msg.receivedDateTime,
      is_read: msg.isRead || false,
      labels: [],
      body_html: msg.body?.contentType === "html" ? msg.body.content : null,
      body_text: msg.body?.contentType === "text" ? msg.body.content : null,
      attachments: [],
    });
  }

  const newCursor = data["@odata.deltaLink"] || data["@odata.nextLink"] || cursor;

  return { messages, cursor: newCursor };
}

async function autoMatch(adminClient: any, partnerId: string | null, userId: string | null, from: string, to: string) {
  const emailRegex = /[\w.-]+@[\w.-]+/g;
  const allEmails = [...(from.match(emailRegex) || []), ...(to.match(emailRegex) || [])];

  let lead_id: string | null = null;
  let klant_id: string | null = null;
  let affiliate_lead_id: string | null = null;

  for (const email of allEmails) {
    if (lead_id && klant_id && affiliate_lead_id) break;

    if (partnerId) {
      if (!lead_id) {
        const { data: lead } = await adminClient
          .from("leads")
          .select("id")
          .eq("partner_id", partnerId)
          .ilike("email", email)
          .limit(1)
          .maybeSingle();
        if (lead) lead_id = lead.id;
      }
      if (!klant_id) {
        const { data: klant } = await adminClient
          .from("klanten")
          .select("id")
          .eq("partner_id", partnerId)
          .ilike("email", email)
          .limit(1)
          .maybeSingle();
        if (klant) klant_id = klant.id;
      }
    }

      if (userId && !affiliate_lead_id) {
        const { data: aLead } = await adminClient
          .from("affiliate_leads")
          .select("id")
          .eq("eigenaar_id", userId)
          .ilike("email", email)
          .limit(1)
          .maybeSingle();
        if (aLead) affiliate_lead_id = aLead.id;
      }
  }

  return { lead_id, klant_id, affiliate_lead_id };
}
