// IMAP-sync via imapflow (Node-compat in Supabase Edge Runtime).
// @ts-ignore — npm: specifier
import { ImapFlow } from "npm:imapflow@1.0.171";

export interface ImapAccount {
  email_adres: string;
  imap_host: string | null;
  imap_port: number | null;
  app_password_plain: string;
  last_uid?: number | null;
}
export interface ImapMessage {
  uid: number;
  messageId: string | null;
  from: string;
  to: string;
  subject: string;
  date: string;
  html: string | null;
  text: string | null;
}

export async function imapFetchNew(account: ImapAccount, limit = 50): Promise<{
  messages: ImapMessage[]; newLastUid: number;
}> {
  const host = account.imap_host || "imap.gmail.com";
  const port = account.imap_port || 993;
  // deno-lint-ignore no-explicit-any
  const client: any = new ImapFlow({
    host, port, secure: true,
    auth: { user: account.email_adres, pass: account.app_password_plain },
    logger: false, emitLogs: false,
  });
  const out: ImapMessage[] = [];
  let newLastUid = account.last_uid ?? 0;

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const sinceUid = (account.last_uid ?? 0) + 1;
      const range = `${sinceUid}:*`;
      let count = 0;
      for await (const m of client.fetch(range, { uid: true, envelope: true, source: true, internalDate: true }, { uid: true })) {
        if (count >= limit) break;
        count++;
        const uid = Number(m.uid);
        if (uid <= (account.last_uid ?? 0)) continue;
        if (uid > newLastUid) newLastUid = uid;
        const env = m.envelope ?? {};
        const from = env.from?.[0]
          ? `${env.from[0].name ? env.from[0].name + " " : ""}<${env.from[0].address}>`.trim()
          : "";
        const to = env.to?.[0]?.address ?? "";
        const raw = m.source ? new TextDecoder().decode(m.source) : "";
        const { html, text } = splitMimeBody(raw);
        out.push({
          uid,
          messageId: env.messageId ?? null,
          from, to,
          subject: env.subject ?? "",
          date: (env.date instanceof Date ? env.date : new Date(env.date ?? Date.now())).toISOString(),
          html, text,
        });
      }
    } finally { lock.release(); }
  } finally { try { await client.logout(); } catch { /* ignore */ } }
  return { messages: out, newLastUid };
}

function splitMimeBody(raw: string): { html: string | null; text: string | null } {
  if (!raw) return { html: null, text: null };
  const split = raw.indexOf("\r\n\r\n");
  const body = split >= 0 ? raw.slice(split + 4) : raw;
  const html = matchPart(body, /content-type:\s*text\/html/i);
  const text = matchPart(body, /content-type:\s*text\/plain/i);
  return { html, text };
}
function matchPart(body: string, ct: RegExp): string | null {
  const blocks = body.split(/\r?\n--/);
  for (const b of blocks) {
    if (ct.test(b)) {
      const hdrEnd = b.indexOf("\r\n\r\n");
      if (hdrEnd >= 0) return b.slice(hdrEnd + 4).trim();
    }
  }
  return ct.test(body) ? body : null;
}