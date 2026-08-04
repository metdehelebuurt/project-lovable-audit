// SMTP send helper voor Gmail App Passwords (denomailer, Deno-native).

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { toAsciiHeader } from "./mail-header.ts";

export interface SmtpAccount {
  email_adres: string;
  smtp_host: string | null;
  smtp_port: number | null;
  app_password_plain: string;
}
export interface SmtpSendInput {
  from: string;
  fromName?: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Uint8Array;
    contentType?: string;
    encoding?: "base64" | "binary";
  }>;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
  }
  return btoa(chunks.join(""));
}

function prepareAttachments(attachments: SmtpSendInput["attachments"]) {
  return attachments?.map((attachment) => {
    if (!(attachment.content instanceof Uint8Array)) return attachment;
    return {
      ...attachment,
      content: bytesToBase64(attachment.content),
      encoding: "base64" as const,
    };
  });
}

function newClient(a: SmtpAccount) {
  const host = a.smtp_host || "smtp.gmail.com";
  const port = a.smtp_port || 465;
  return new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: a.email_adres, password: a.app_password_plain },
    },
  });
}

export async function smtpSend(a: SmtpAccount, msg: SmtpSendInput): Promise<void> {
  const client = newClient(a);
  // Headers ASCII-veilig maken: denomailer breekt lange encoded-words af,
  // waardoor de ontvanger ruwe MIME-tekst in plaats van de e-mail ziet.
  const safeSubject = toAsciiHeader(msg.subject);
  const safeFromName = msg.fromName ? toAsciiHeader(msg.fromName, 80) : "";
  const attachments = prepareAttachments(msg.attachments);
  try {
    await client.send({
      from: safeFromName ? `${safeFromName} <${msg.from}>` : msg.from,
      to: msg.to,
      cc: msg.cc,
      bcc: msg.bcc,
      subject: safeSubject,
      content: msg.text ?? "Deze e-mail bevat HTML-inhoud.",
      html: msg.html,
      replyTo: msg.replyTo,
      attachments,
    });
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}

/** Verifieer credentials door een korte mail naar zichzelf te sturen. */
export async function smtpVerify(a: SmtpAccount): Promise<void> {
  const client = newClient(a);
  try {
    await client.send({
      from: a.email_adres,
      to: a.email_adres,
      subject: "Mijnhuis koppelingstest",
      content: "SMTP-koppeling geverifieerd.",
    });
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}