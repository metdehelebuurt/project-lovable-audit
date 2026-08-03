import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sendViaSMTP as sharedSendViaSMTP,
  sendViaGmailApi as sharedSendViaGmailApi,
  sendViaMsGraphApi as sharedSendViaMsGraphApi,
  refreshOAuthToken as sharedRefreshOAuthToken,
  fetchAttachment,
  verifyPdfBytes,
} from "../_shared/email-send.ts";
import { decryptAppPassword } from "../_shared/email-crypto.ts";
import { smtpSend } from "../_shared/smtp-send.ts";
import { toAsciiHeader } from "../_shared/mail-header.ts";
import {
  guardAttachment,
  recordAudit,
  assertAttachmentReady,
  newRequestId,
  type AccountType,
  type AuditContext,
} from "../_shared/offerte-attachment-audit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendViaSMTP(
  host: string, port: number, user: string, pass: string,
  from: string, fromName: string, to: string, subject: string, html: string
) {
  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  const client = new SMTPClient({
    connection: { hostname: host, port, tls: port === 465, auth: { username: user, password: pass } },
  });
  await client.send({
    from: `${toAsciiHeader(fromName, 80)} <${from}>`,
    to,
    subject: toAsciiHeader(subject),
    content: "auto",
    html,
  });
  await client.close();
}

async function saveToImapSent(
  host: string, port: number, user: string, pass: string, useSsl: boolean,
  from: string, fromName: string, to: string, subject: string, html: string
) {
  try {
    const conn = useSsl
      ? await Deno.connectTls({ hostname: host, port })
      : await Deno.connect({ hostname: host, port });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buf = new Uint8Array(4096);

    const read = async () => {
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : "";
    };
    const write = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await read();
    };

    // Read greeting
    await read();

    // Login
    const loginResp = await write(`a1 LOGIN "${user}" "${pass}"`);
    if (!loginResp.includes("OK")) {
      conn.close();
      console.error("IMAP login failed:", loginResp);
      return false;
    }

    // Build RFC822 message
    const date = new Date().toUTCString();
    const rfc822 = [
      `From: ${fromName} <${from}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${date}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
    ].join("\r\n");

    const msgBytes = encoder.encode(rfc822);

    // Try common sent folder names
    const sentFolders = ["Sent", "INBOX.Sent", "Sent Items", "Verzonden items", "[Gmail]/Sent Mail", "INBOX.Sent Items"];
    let appended = false;

    for (const folder of sentFolders) {
      const resp = await write(`a2 APPEND "${folder}" (\\Seen) {${msgBytes.length}}`);
      if (resp.includes("+")) {
        await conn.write(msgBytes);
        await conn.write(encoder.encode("\r\n"));
        const appendResp = await read();
        if (appendResp.includes("OK")) {
          appended = true;
          break;
        }
      }
    }

    await write("a3 LOGOUT");
    conn.close();
    return appended;
  } catch (err) {
    console.error("IMAP save error:", err);
    return false;
  }
}

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
    const { action, from_account_id } = body;

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userRow } = await adminClient.from("users").select("partner_id, rol").eq("id", userId).single();
    if (!userRow?.partner_id) {
      return new Response(JSON.stringify({ error: "Geen partner gekoppeld" }), { status: 400, headers: corsHeaders });
    }

    const { data: partner } = await adminClient
      .from("partners")
      .select("naam, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, afzender_email, afzender_naam, imap_host, imap_port, imap_user, imap_pass_encrypted, imap_use_ssl, email_provider")
      .eq("id", userRow.partner_id)
      .single();

    // Zoek beste e-mailaccount:
    // 1) Expliciete keuze (from_account_id) van de gebruiker (SenderPicker).
    // 2) Primair persoonlijk account, anders recentst gebruikte persoonlijke.
    // 3) Anders een actief account binnen de organisatie.
    let emailAccount: any = null;
    if (from_account_id && typeof from_account_id === "string") {
      const { data: expl } = await adminClient
        .from("email_accounts").select("*")
        .eq("id", from_account_id).eq("actief", true).maybeSingle();
      if (expl) emailAccount = expl;
    }
    {
      if (!emailAccount) {
        const { data: own } = await adminClient
          .from("email_accounts").select("*")
          .eq("user_id", userId).eq("actief", true)
          .order("is_primair", { ascending: false })
          .order("laatst_gebruikt_op", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }).limit(1);
        if (own && own.length) emailAccount = own[0];
      }
    }
    if (!emailAccount) {
      const { data: partnerAcc } = await adminClient
        .from("email_accounts").select("*")
        .eq("partner_id", userRow.partner_id).eq("actief", true)
        .order("is_default_voor_partner", { ascending: false })
        .order("created_at", { ascending: true }).limit(1);
      if (partnerAcc && partnerAcc.length) emailAccount = partnerAcc[0];
    }

    if (!partner) {
      return new Response(JSON.stringify({ error: "Partner niet gevonden" }), { status: 404, headers: corsHeaders });
    }

    // ─── Test action ───
    if (action === "test") {
      if (!partner.smtp_host || !partner.afzender_email || !partner.smtp_user || !partner.smtp_pass_encrypted) {
        return new Response(JSON.stringify({ error: "SMTP-instellingen zijn niet volledig geconfigureerd" }), { status: 400, headers: corsHeaders });
      }

      const testHtml = `<div style="font-family:sans-serif;padding:20px;">
        <h2>✅ Test geslaagd!</h2>
        <p>Uw SMTP-instellingen zijn correct geconfigureerd.</p>
        <p style="color:#888;font-size:12px;">— Mijnhuis.nu platform</p>
      </div>`;

      await sendViaSMTP(
        partner.smtp_host, partner.smtp_port || 587, partner.smtp_user, partner.smtp_pass_encrypted,
        partner.afzender_email, partner.afzender_naam || partner.naam,
        partner.afzender_email, "Test e-mail van Mijnhuis.nu", testHtml
      );

      // Try saving to IMAP sent folder
      if (partner.imap_host && partner.imap_user && partner.imap_pass_encrypted) {
        await saveToImapSent(
          partner.imap_host, partner.imap_port || 993, partner.imap_user, partner.imap_pass_encrypted,
          partner.imap_use_ssl !== false,
          partner.afzender_email, partner.afzender_naam || partner.naam,
          partner.afzender_email, "Test e-mail van Mijnhuis.nu", testHtml
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Read inbox action ───
    if (action === "read_inbox") {
      if (!partner.imap_host || !partner.imap_user || !partner.imap_pass_encrypted) {
        return new Response(JSON.stringify({ error: "IMAP-instellingen zijn niet geconfigureerd" }), { status: 400, headers: corsHeaders });
      }

      const { folder = "INBOX", limit = 20 } = body;
      const emails = await readImapFolder(
        partner.imap_host, partner.imap_port || 993, partner.imap_user, partner.imap_pass_encrypted,
        partner.imap_use_ssl !== false, folder, limit
      );

      return new Response(JSON.stringify({ emails }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── List folders action ───
    if (action === "list_folders") {
      if (!partner.imap_host || !partner.imap_user || !partner.imap_pass_encrypted) {
        return new Response(JSON.stringify({ error: "IMAP-instellingen zijn niet geconfigureerd" }), { status: 400, headers: corsHeaders });
      }

      const folders = await listImapFolders(
        partner.imap_host, partner.imap_port || 993, partner.imap_user, partner.imap_pass_encrypted,
        partner.imap_use_ssl !== false
      );

      return new Response(JSON.stringify({ folders }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Send offerte email ───
    const { offerte_id, ontvanger_email, html_body, subject: customSubject, attachment_path, attachment_filename, cc, bcc } = body;
    if (!offerte_id || !ontvanger_email) {
      return new Response(JSON.stringify({ error: "offerte_id en ontvanger_email zijn verplicht" }), { status: 400, headers: corsHeaders });
    }

    const { data: offerte } = await adminClient
      .from("offertes").select("*").eq("id", offerte_id).eq("partner_id", userRow.partner_id).single();

    if (!offerte) {
      return new Response(JSON.stringify({ error: "Offerte niet gevonden" }), { status: 404, headers: corsHeaders });
    }

    // Zorg dat er een share_token bestaat zodat de acceptatielink in de e-mail werkt.
    if (!offerte.share_token) {
      const newToken = crypto.randomUUID().replace(/-/g, "");
      await adminClient.from("offertes").update({ share_token: newToken }).eq("id", offerte_id);
      offerte.share_token = newToken;
    }

    // Bepaal verzendmethode op basis van het gevonden account:
    // 1) OAuth API (Gmail/Microsoft) als access_token + refresh_token beschikbaar
    // 2) SMTP via Gmail App Password als app_password_encrypted aanwezig
    // 3) Partner-SMTP als laatste redmiddel
    const hasOauth = !!(emailAccount && emailAccount.access_token && emailAccount.refresh_token);
    const hasAppPw = !!(emailAccount && emailAccount.app_password_encrypted);
    const hasPartnerSmtp = !!(partner.smtp_host && partner.afzender_email && partner.smtp_user && partner.smtp_pass_encrypted);

    if (!hasOauth && !hasAppPw && !hasPartnerSmtp) {
      return new Response(JSON.stringify({ error: "E-mailconfiguratie is niet ingesteld. Ga naar Instellingen → E-mail configuratie." }), { status: 400, headers: corsHeaders });
    }

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

    const portalBase = Deno.env.get("PUBLIC_APP_URL") || "https://app.mijnhuis.nu";
    const portalUrl = `${portalBase.replace(/\/$/, "")}/offerte/${offerte.share_token}`;

    const baseHtml = html_body || `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="border-bottom:3px solid #5B58E1;padding-bottom:16px;margin-bottom:24px;">
          <h2 style="margin:0;color:#1a1a2e;">${partner.afzender_naam || partner.naam}</h2>
          <p style="margin:4px 0 0;color:#888;font-size:14px;">Offerte ${offerte.offertenummer}</p>
        </div>
        <p>Beste ${offerte.klant_naam},</p>
        <p>Hierbij ontvangt u onze offerte met nummer <strong>${offerte.offertenummer}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:8px;font-weight:bold;">Totaalbedrag (incl. BTW)</td>
            <td style="padding:8px;text-align:right;font-weight:bold;">${formatCurrency(offerte.totaal_bedrag)}</td>
          </tr>
          <tr>
            <td style="padding:8px;">Geldig tot</td>
            <td style="padding:8px;text-align:right;">${new Date(offerte.geldig_tot).toLocaleDateString("nl-NL")}</td>
          </tr>
        </table>
        <p>Neem gerust contact met ons op als u vragen heeft.</p>
        <p>Met vriendelijke groet,<br/><strong>${partner.afzender_naam || partner.naam}</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;" />
        <p style="color:#888;font-size:12px;">Deze e-mail is verstuurd via het Mijnhuis.nu platform.</p>
      </div>
    `;

    // Failsafe: als de interactieve offertelink ontbreekt in de body, voeg hem alsnog toe.
    const html = baseHtml.includes(`/offerte/${offerte.share_token}`)
      ? baseHtml
      : `${baseHtml}<p style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:0 20px;"><a href="${portalUrl}" style="display:inline-block;padding:12px 32px;background-color:#5B58E1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Offerte online bekijken &amp; accepteren</a></p>`;

    const emailSubject = customSubject || `Offerte ${offerte.offertenummer} — ${partner.afzender_naam || partner.naam}`;

    let imapSaved = false;

    // ─── Bepaal account-type voor audit-logging ───
    const accountType: AccountType = hasOauth
      ? (emailAccount?.provider === "google" ? "gmail_oauth" : "ms_graph_oauth")
      : hasAppPw
        ? "smtp_app_password"
        : hasPartnerSmtp
          ? "partner_smtp"
          : "unknown";

    const auditCtx: AuditContext = {
      offerteId: offerte_id,
      partnerId: userRow.partner_id,
      userId,
      accountId: emailAccount?.id ?? null,
      accountType,
      attachmentPath: attachment_path || null,
      requestId: newRequestId(),
    };

    // FAILSAFE: centrale guard. Blokkeert verzending als PDF ontbreekt/ongeldig
    // is, schrijft altijd een audit-rij (die via DB-trigger alerts activeert).
    const guard = await guardAttachment(
      adminClient,
      auditCtx,
      attachment_filename || `Offerte-${offerte.offertenummer}.pdf`,
    );
    if (!guard.ok) {
      await adminClient.from("email_log").insert({
        partner_id: userRow.partner_id, offerte_id, ontvanger_email,
        onderwerp: customSubject || `Offerte ${offerte.offertenummer}`,
        html_body: html_body || "", status: "mislukt", type: "offerte",
        verzonden_door_id: userId,
        error_message: `PDF-bijlage guard: ${guard.status} — ${guard.reason || ""}`.trim(),
      });
      return new Response(
        JSON.stringify({
          error: "MISSING_PDF_ATTACHMENT",
          detail: guard.reason,
          status: guard.status,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const attachment = guard.attachment!;

    if (hasOauth) {
      // Send via OAuth API (Gmail or Microsoft Graph)
      let accessToken = emailAccount.access_token;
      if (new Date(emailAccount.token_expiry) <= new Date()) {
        accessToken = await sharedRefreshOAuthToken(adminClient, emailAccount);
      }

      assertAttachmentReady(attachment);
      try {
        if (emailAccount.provider === "google") {
          await sharedSendViaGmailApi({ accessToken, from: emailAccount.email_adres, to: ontvanger_email, cc: Array.isArray(cc) ? cc : [], bcc: Array.isArray(bcc) ? bcc : [], subject: emailSubject, html, attachment });
        } else {
          await sharedSendViaMsGraphApi({ accessToken, to: ontvanger_email, cc: Array.isArray(cc) ? cc : [], bcc: Array.isArray(bcc) ? bcc : [], subject: emailSubject, html, attachment });
        }
      } catch (sendErr) {
        await recordAudit(adminClient, auditCtx, {
          status: "send_error",
          bytesSize: attachment.bytes.length,
          pdfValid: true,
          provider: emailAccount.provider === "google" ? "gmail_api" : "ms_graph_api",
          error: (sendErr as Error).message,
        });
        throw sendErr;
      }
      imapSaved = true; // OAuth APIs auto-save to sent
      await recordAudit(adminClient, auditCtx, {
        status: "ok",
        bytesSize: attachment.bytes.length,
        pdfValid: true,
        provider: emailAccount.provider === "google" ? "gmail_api" : "ms_graph_api",
      });

      // Also save to email_berichten
      await adminClient.from("email_berichten").insert({
        email_account_id: emailAccount.id,
        partner_id: userRow.partner_id,
        richting: "uitgaand",
        van: emailAccount.email_adres,
        aan: ontvanger_email,
        onderwerp: emailSubject,
        body_html: html,
        datum: new Date().toISOString(),
        is_gelezen: true,
        offerte_id,
        lead_id: offerte.lead_id || null,
      });
    } else if (hasAppPw) {
      // Send via SMTP met Gmail App Password vanaf het gekoppelde account
      const plain = await decryptAppPassword(emailAccount.app_password_encrypted as string);
      assertAttachmentReady(attachment);
      const smtpAttachments = [{
        filename: attachment.filename,
        content: attachment.bytes,
        contentType: attachment.contentType,
        encoding: "binary" as const,
      }];
      // Post-guard sanity check op de outgoing payload zelf.
      if (!smtpAttachments[0].content || (smtpAttachments[0].content as Uint8Array).length === 0) {
        await recordAudit(adminClient, auditCtx, {
          status: "sent_without_attachment", provider: "smtp_app_password",
          error: "outgoing SMTP payload heeft lege attachment array",
        });
        throw new Error("SMTP payload attachment leeg (guard bypass)");
      }
      try {
        await smtpSend(
          {
            email_adres: emailAccount.email_adres,
            smtp_host: emailAccount.smtp_host,
            smtp_port: emailAccount.smtp_port,
            app_password_plain: plain,
          },
          {
            from: emailAccount.email_adres,
            fromName: partner.afzender_naam || partner.naam,
            to: ontvanger_email,
            cc: Array.isArray(cc) ? cc : [],
            bcc: Array.isArray(bcc) ? bcc : [],
            subject: emailSubject,
            html,
            attachments: smtpAttachments,
          },
        );
      } catch (sendErr) {
        await recordAudit(adminClient, auditCtx, {
          status: "send_error", bytesSize: attachment.bytes.length,
          pdfValid: true, provider: "smtp_app_password",
          error: (sendErr as Error).message,
        });
        throw sendErr;
      }
      imapSaved = true; // Gmail slaat SMTP-verzending automatisch op in Verzonden
      await recordAudit(adminClient, auditCtx, {
        status: "ok", bytesSize: attachment.bytes.length,
        pdfValid: true, provider: "smtp_app_password",
      });

      await adminClient.from("email_berichten").insert({
        email_account_id: emailAccount.id,
        partner_id: userRow.partner_id,
        richting: "uitgaand",
        van: emailAccount.email_adres,
        aan: ontvanger_email,
        onderwerp: emailSubject,
        body_html: html,
        datum: new Date().toISOString(),
        is_gelezen: true,
        offerte_id,
        lead_id: offerte.lead_id || null,
        bron_method: "smtp_app_password",
      });
    } else {
      // Send via SMTP
      assertAttachmentReady(attachment);
      try {
        await sharedSendViaSMTP({
          host: partner.smtp_host, port: partner.smtp_port || 587,
          user: partner.smtp_user, pass: partner.smtp_pass_encrypted,
          from: partner.afzender_email, fromName: partner.afzender_naam || partner.naam,
          to: ontvanger_email, cc: Array.isArray(cc) ? cc : [], bcc: Array.isArray(bcc) ? bcc : [], subject: emailSubject, html, attachment,
        });
      } catch (sendErr) {
        await recordAudit(adminClient, auditCtx, {
          status: "send_error", bytesSize: attachment.bytes.length,
          pdfValid: true, provider: "partner_smtp",
          error: (sendErr as Error).message,
        });
        throw sendErr;
      }
      await recordAudit(adminClient, auditCtx, {
        status: "ok", bytesSize: attachment.bytes.length,
        pdfValid: true, provider: "partner_smtp",
      });

      // Save to IMAP sent folder
      if (partner.imap_host && partner.imap_user && partner.imap_pass_encrypted) {
        imapSaved = await saveToImapSent(
          partner.imap_host, partner.imap_port || 993, partner.imap_user, partner.imap_pass_encrypted,
          partner.imap_use_ssl !== false,
          partner.afzender_email, partner.afzender_naam || partner.naam,
          ontvanger_email, emailSubject, html
        ) || false;
      }
    }

    // Log the email
    await adminClient.from("email_log").insert({
      partner_id: userRow.partner_id,
      offerte_id,
      ontvanger_email,
      onderwerp: emailSubject,
      html_body: html,
      status: "verzonden",
      type: "offerte",
      verzonden_door_id: userId,
      imap_saved: imapSaved,
    });

    // Update status
    if (offerte.status === "concept") {
      await adminClient.from("offertes").update({ status: "verzonden" }).eq("id", offerte_id);
    }

    // Bijlage NIET direct verwijderen: bewaard voor audit / hersturen.
    // Een aparte retentie-job kan oude bestanden opruimen (bv. > 30 dagen).

    return new Response(JSON.stringify({ success: true, imap_saved: imapSaved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-offerte-email error:", err);
    return new Response(JSON.stringify({ error: err.message || "Interne fout" }), { status: 500, headers: corsHeaders });
  }
});

// ─── IMAP helper: read folder ───
async function readImapFolder(
  host: string, port: number, user: string, pass: string, useSsl: boolean,
  folder: string, limit: number
): Promise<Array<{ uid: string; from: string; to: string; subject: string; date: string; seen: boolean; snippet: string }>> {
  const emails: Array<{ uid: string; from: string; to: string; subject: string; date: string; seen: boolean; snippet: string }> = [];

  try {
    const conn = useSsl
      ? await Deno.connectTls({ hostname: host, port })
      : await Deno.connect({ hostname: host, port });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = "";
    const readFull = async (): Promise<string> => {
      const buf = new Uint8Array(8192);
      const n = await conn.read(buf);
      if (!n) return "";
      buffer += decoder.decode(buf.subarray(0, n));
      const result = buffer;
      buffer = "";
      return result;
    };

    const write = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      // Wait a bit for server response
      await new Promise(r => setTimeout(r, 200));
      return await readFull();
    };

    // Read greeting
    await readFull();

    // Login
    const loginResp = await write(`a1 LOGIN "${user}" "${pass}"`);
    if (!loginResp.includes("OK")) {
      conn.close();
      return [];
    }

    // Select folder
    const selectResp = await write(`a2 SELECT "${folder}"`);
    const existsMatch = selectResp.match(/\* (\d+) EXISTS/);
    const total = existsMatch ? parseInt(existsMatch[1]) : 0;

    if (total === 0) {
      await write("a5 LOGOUT");
      conn.close();
      return [];
    }

    // Fetch last N messages
    const start = Math.max(1, total - limit + 1);
    const fetchResp = await write(`a3 FETCH ${start}:${total} (UID FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)])`);

    // Parse simple headers from response
    const parts = fetchResp.split(/\* \d+ FETCH/);
    for (const part of parts) {
      if (!part.trim()) continue;

      const uidMatch = part.match(/UID (\d+)/);
      const uid = uidMatch ? uidMatch[1] : "";
      const seen = part.includes("\\Seen");

      const fromMatch = part.match(/From:\s*(.+?)(?:\r?\n(?!\s))/i);
      const toMatch = part.match(/To:\s*(.+?)(?:\r?\n(?!\s))/i);
      const subjectMatch = part.match(/Subject:\s*(.+?)(?:\r?\n(?!\s))/i);
      const dateMatch = part.match(/Date:\s*(.+?)(?:\r?\n(?!\s))/i);

      if (uid) {
        emails.push({
          uid,
          from: fromMatch ? fromMatch[1].trim() : "",
          to: toMatch ? toMatch[1].trim() : "",
          subject: subjectMatch ? subjectMatch[1].trim() : "(geen onderwerp)",
          date: dateMatch ? dateMatch[1].trim() : "",
          seen,
          snippet: "",
        });
      }
    }

    await write("a5 LOGOUT");
    conn.close();
  } catch (err) {
    console.error("IMAP read error:", err);
  }

  return emails.reverse();
}

// ─── IMAP helper: list folders ───
async function listImapFolders(
  host: string, port: number, user: string, pass: string, useSsl: boolean
): Promise<string[]> {
  const folders: string[] = [];
  try {
    const conn = useSsl
      ? await Deno.connectTls({ hostname: host, port })
      : await Deno.connect({ hostname: host, port });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buf = new Uint8Array(8192);

    const read = async () => {
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : "";
    };
    const write = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      await new Promise(r => setTimeout(r, 200));
      return await read();
    };

    await read();
    const loginResp = await write(`a1 LOGIN "${user}" "${pass}"`);
    if (!loginResp.includes("OK")) { conn.close(); return []; }

    const listResp = await write('a2 LIST "" "*"');
    const lines = listResp.split("\r\n");
    for (const line of lines) {
      const match = line.match(/\* LIST \(.*?\) ".*?" "?(.+?)"?\s*$/);
      if (match) {
        folders.push(match[1].replace(/"/g, ""));
      }
    }

    await write("a3 LOGOUT");
    conn.close();
  } catch (err) {
    console.error("IMAP list error:", err);
  }
  return folders;
}

// ─── OAuth helpers ───

async function refreshOAuthToken(adminClient: any, account: any): Promise<string> {
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
  if (data.error) throw new Error(`Token refresh failed: ${data.error}`);

  await adminClient.from("email_accounts").update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
  }).eq("id", account.id);

  return data.access_token;
}

async function sendViaGmailApi(accessToken: string, from: string, to: string, subject: string, html: string) {
  const rawMessage = [
    `From: ${from}`, `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`, `Content-Type: text/html; charset=UTF-8`, ``, html,
  ].join("\r\n");

  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!resp.ok) throw new Error(`Gmail send failed: ${await resp.text()}`);
}

async function sendViaMsGraphApi(accessToken: string, to: string, subject: string, html: string) {
  const resp = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!resp.ok) throw new Error(`Graph send failed: ${await resp.text()}`);
}
