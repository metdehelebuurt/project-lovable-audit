// Gedeelde e-mail verzendlogica voor offertes, facturen en orderbevestigingen.
// Ondersteunt SMTP (denomailer), Gmail API en Microsoft Graph API met PDF-bijlage.

export interface AttachmentInfo {
  filename: string;
  bytes: Uint8Array;
  contentType: string;
}

export async function fetchAttachment(
  adminClient: any,
  storagePath: string,
  filename: string,
): Promise<AttachmentInfo | null> {
  if (!storagePath) return null;
  const { data, error } = await adminClient.storage.from("email-bijlagen").download(storagePath);
  if (error || !data) {
    console.error("Attachment download failed:", error);
    return null;
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  return { filename, bytes, contentType: data.type || "application/pdf" };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function sendViaSMTP(opts: {
  host: string; port: number; user: string; pass: string;
  from: string; fromName: string; to: string; subject: string; html: string;
  cc?: string[]; bcc?: string[];
  attachment?: AttachmentInfo | null;
}) {
  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  const client = new SMTPClient({
    connection: { hostname: opts.host, port: opts.port, tls: opts.port === 465, auth: { username: opts.user, password: opts.pass } },
  });
  const message: any = {
    from: `${opts.fromName} <${opts.from}>`,
    to: opts.to,
    subject: opts.subject,
    content: "auto",
    html: opts.html,
  };
  if (opts.cc && opts.cc.length > 0) message.cc = opts.cc;
  if (opts.bcc && opts.bcc.length > 0) message.bcc = opts.bcc;
  if (opts.attachment) {
    message.attachments = [{
      filename: opts.attachment.filename,
      content: opts.attachment.bytes,
      contentType: opts.attachment.contentType,
      encoding: "binary",
    }];
  }
  await client.send(message);
  await client.close();
}

export async function sendViaGmailApi(opts: {
  accessToken: string; from: string; to: string; subject: string; html: string;
  cc?: string[]; bcc?: string[];
  attachment?: AttachmentInfo | null;
}) {
  const subjectEnc = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(opts.subject)))}?=`;
  const ccLine = opts.cc && opts.cc.length > 0 ? `Cc: ${opts.cc.join(", ")}\r\n` : "";
  const bccLine = opts.bcc && opts.bcc.length > 0 ? `Bcc: ${opts.bcc.join(", ")}\r\n` : "";
  let raw: string;

  if (opts.attachment) {
    const boundary = `mh_${Date.now().toString(36)}`;
    const pdfB64 = bytesToBase64(opts.attachment.bytes).replace(/(.{76})/g, "$1\r\n");
    raw = [
      `From: ${opts.from}`,
      `To: ${opts.to}`,
      ...(ccLine ? [ccLine.trimEnd()] : []),
      ...(bccLine ? [bccLine.trimEnd()] : []),
      `Subject: ${subjectEnc}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      opts.html,
      ``,
      `--${boundary}`,
      `Content-Type: ${opts.attachment.contentType}; name="${opts.attachment.filename}"`,
      `Content-Disposition: attachment; filename="${opts.attachment.filename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      pdfB64,
      ``,
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    raw = [
      `From: ${opts.from}`, `To: ${opts.to}`,
      ...(ccLine ? [ccLine.trimEnd()] : []),
      ...(bccLine ? [bccLine.trimEnd()] : []),
      `Subject: ${subjectEnc}`,
      `MIME-Version: 1.0`, `Content-Type: text/html; charset=UTF-8`, ``, opts.html,
    ].join("\r\n");
  }

  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!resp.ok) throw new Error(`Gmail send failed: ${await resp.text()}`);
}

export async function sendViaMsGraphApi(opts: {
  accessToken: string; to: string; subject: string; html: string;
  cc?: string[]; bcc?: string[];
  attachment?: AttachmentInfo | null;
}) {
  const message: any = {
    subject: opts.subject,
    body: { contentType: "HTML", content: opts.html },
    toRecipients: [{ emailAddress: { address: opts.to } }],
  };
  if (opts.cc && opts.cc.length > 0) {
    message.ccRecipients = opts.cc.map((a) => ({ emailAddress: { address: a } }));
  }
  if (opts.bcc && opts.bcc.length > 0) {
    message.bccRecipients = opts.bcc.map((a) => ({ emailAddress: { address: a } }));
  }
  if (opts.attachment) {
    message.attachments = [{
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: opts.attachment.filename,
      contentType: opts.attachment.contentType,
      contentBytes: bytesToBase64(opts.attachment.bytes),
    }];
  }
  const resp = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });
  if (!resp.ok) throw new Error(`Graph send failed: ${await resp.text()}`);
}

export async function refreshOAuthToken(adminClient: any, account: any): Promise<string> {
  const isGoogle = account.provider === "google";
  const tokenUrl = isGoogle
    ? "https://oauth2.googleapis.com/token"
    : "https://login.microsoftonline.com/common/oauth2/v2.0/token";

  const params: Record<string, string> = isGoogle
    ? {
        client_id: Deno.env.get("GOOGLE_EMAIL_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_EMAIL_CLIENT_SECRET")!,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }
    : {
        client_id: Deno.env.get("MICROSOFT_EMAIL_CLIENT_ID")!,
        client_secret: Deno.env.get("MICROSOFT_EMAIL_CLIENT_SECRET")!,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
        scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access",
      };

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