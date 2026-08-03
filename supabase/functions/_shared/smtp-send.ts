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
      attachments: msg.attachments as any,
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