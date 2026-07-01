// Eenmalige beheer-functie: koppelt info@smartaccu.nl aan Hoang's account
// met het opgegeven Gmail App Password, en verstuurt direct een testmail.
// Wordt na uitvoering verwijderd.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptAppPassword } from "../_shared/email-crypto.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function smtpSendRaw(opts: {
  host: string; port: number; user: string; pass: string;
  from: string; fromName: string; to: string; subject: string; html: string;
}): Promise<void> {
  const conn = await Deno.connectTls({ hostname: opts.host, port: opts.port });
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const buf = new Uint8Array(8192);
  const log: string[] = [];
  const read = async (): Promise<string> => {
    const n = await conn.read(buf);
    if (!n) throw new Error("SMTP-verbinding gesloten");
    const s = dec.decode(buf.subarray(0, n));
    log.push("< " + s.trim());
    return s;
  };
  const write = async (s: string) => {
    log.push("> " + s.replace(/\r\n$/, ""));
    await conn.write(enc.encode(s));
  };
  const expect = async (code: string, step: string) => {
    const r = await read();
    if (!r.startsWith(code)) throw new Error(`${step} faalde (verwachte ${code}): ${r.trim()}`);
    return r;
  };
  try {
    await expect("220", "greeting");
    await write("EHLO mijnhuis.nu\r\n"); await expect("250", "EHLO");
    await write("AUTH LOGIN\r\n"); await expect("334", "AUTH LOGIN");
    await write(btoa(opts.user) + "\r\n"); await expect("334", "user");
    await write(btoa(opts.pass) + "\r\n"); await expect("235", "pass");
    await write(`MAIL FROM:<${opts.from}>\r\n`); await expect("250", "MAIL FROM");
    await write(`RCPT TO:<${opts.to}>\r\n`); await expect("250", "RCPT TO");
    await write("DATA\r\n"); await expect("354", "DATA");

    const subjectB64 = btoa(unescape(encodeURIComponent(opts.subject)));
    const headers = [
      `From: "${opts.fromName}" <${opts.from}>`,
      `To: ${opts.to}`,
      `Subject: =?UTF-8?B?${subjectB64}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Date: ${new Date().toUTCString()}`,
    ].join("\r\n");
    // Dot-stuffing
    const body = opts.html.replace(/\r?\n\./g, "\n..");
    await write(headers + "\r\n\r\n" + body + "\r\n.\r\n");
    await expect("250", "body accepted");
    try { await write("QUIT\r\n"); } catch { /* ignore */ }
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const userId: string = body.user_id;
    const partnerId: string = body.partner_id;
    const email: string = String(body.email).trim().toLowerCase();
    const password: string = String(body.app_password).replace(/\s+/g, "");
    const testTo: string = String(body.test_to);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const encrypted = await encryptAppPassword(password);

    // Upsert email_accounts row voor deze user
    const { data: existing } = await admin
      .from("email_accounts")
      .select("id, access_token")
      .eq("user_id", userId).eq("provider", "google").maybeSingle();

    let accountId: string;
    if (existing) {
      const newMethod = existing.access_token ? "beide" : "app_password";
      const { data: upd, error } = await admin.from("email_accounts").update({
        email_adres: email, auth_method: newMethod,
        app_password_encrypted: encrypted,
        smtp_host: "smtp.gmail.com", smtp_port: 465,
        imap_host: "imap.gmail.com", imap_port: 993,
        actief: true, needs_reauth: false,
        last_send_error: null, last_send_error_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id).select("id").single();
      if (error) throw error;
      accountId = upd.id;
    } else {
      const { data: ins, error } = await admin.from("email_accounts").insert({
        user_id: userId, partner_id: partnerId,
        provider: "google", email_adres: email,
        auth_method: "app_password",
        app_password_encrypted: encrypted,
        smtp_host: "smtp.gmail.com", smtp_port: 465,
        imap_host: "imap.gmail.com", imap_port: 993,
        actief: true,
      }).select("id").single();
      if (error) throw error;
      accountId = ins.id;
    }

    // Verstuur testmail via raw SMTP
    const html = `
      <p>Hallo Esteban,</p>
      <p>Dit is een testbericht vanuit <strong>info@smartaccu.nl</strong> om te bevestigen
      dat de e-mailkoppeling van Hoang / Smartaccu correct werkt binnen mijnhuis.nu.</p>
      <p>Zowel verzenden (SMTP) als ontvangen (IMAP) is nu ingericht via het Gmail App-wachtwoord.</p>
      <p>Met vriendelijke groet,<br/>mijnhuis.nu</p>
    `;
    await smtpSendRaw({
      host: "smtp.gmail.com", port: 465,
      user: email, pass: password,
      from: email, fromName: "Smartaccu via mijnhuis.nu",
      to: testTo,
      subject: "Testbericht koppeling info@smartaccu.nl",
      html,
    });

    // Log ook in email_berichten (uitgaand)
    await admin.from("email_berichten").insert({
      email_account_id: accountId,
      partner_id: partnerId,
      user_id: userId,
      richting: "uitgaand",
      van: email, aan: testTo,
      onderwerp: "Testbericht koppeling info@smartaccu.nl",
      body_html: html,
      datum: new Date().toISOString(),
      is_gelezen: true,
      bron_method: "smtp_app_password",
      via_account_id: accountId,
    });

    return new Response(JSON.stringify({ ok: true, account_id: accountId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false, error: e instanceof Error ? e.message : String(e),
    }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});