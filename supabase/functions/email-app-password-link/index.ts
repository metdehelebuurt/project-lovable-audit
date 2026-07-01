// Edge function: koppel Gmail via App-wachtwoord. Valideert SMTP-login,
// versleutelt het wachtwoord en slaat het op in email_accounts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptAppPassword } from "../_shared/email-crypto.ts";

/**
 * Lightweight SMTP AUTH LOGIN handshake. Verifieert credentials zonder een
 * daadwerkelijke testmail te versturen (voorkomt vervuiling van de inbox en
 * omzeilt bekende hangs van denomailer op Deno Deploy).
 */
async function smtpAuthCheck(host: string, port: number, user: string, pass: string): Promise<void> {
  const conn = await Deno.connectTls({ hostname: host, port });
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const buf = new Uint8Array(4096);
  const read = async (): Promise<string> => {
    const n = await conn.read(buf);
    if (!n) throw new Error("SMTP-verbinding gesloten");
    return dec.decode(buf.subarray(0, n));
  };
  const write = (s: string) => conn.write(enc.encode(s));
  const expect = async (code: string, step: string) => {
    const resp = await read();
    if (!resp.startsWith(code)) {
      try { await write("QUIT\r\n"); } catch { /* ignore */ }
      try { conn.close(); } catch { /* ignore */ }
      throw new Error(`${step}: ${resp.trim()}`);
    }
    return resp;
  };
  try {
    await expect("220", "SMTP-groet");
    await write(`EHLO mijnhuis.nu\r\n`);
    await expect("250", "EHLO");
    await write("AUTH LOGIN\r\n");
    await expect("334", "AUTH LOGIN");
    await write(btoa(user) + "\r\n");
    await expect("334", "gebruikersnaam");
    await write(btoa(pass) + "\r\n");
    await expect("235", "wachtwoord");
    try { await write("QUIT\r\n"); } catch { /* ignore */ }
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

/**
 * IMAP LOGIN sanity-check zodat we zeker weten dat het app-wachtwoord ook voor
 * inkomende sync werkt. Snel en zonder mailbox-selectie.
 */
async function imapAuthCheck(host: string, port: number, user: string, pass: string): Promise<void> {
  const conn = await Deno.connectTls({ hostname: host, port });
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const buf = new Uint8Array(4096);
  const read = async () => {
    const n = await conn.read(buf);
    if (!n) throw new Error("IMAP-verbinding gesloten");
    return dec.decode(buf.subarray(0, n));
  };
  try {
    await read(); // greeting
    const tag = "a1";
    const safePass = pass.replace(/([\\"])/g, "\\$1");
    await conn.write(enc.encode(`${tag} LOGIN "${user}" "${safePass}"\r\n`));
    const resp = await read();
    if (!/^a1 OK/mi.test(resp)) {
      throw new Error(`IMAP LOGIN mislukt: ${resp.trim()}`);
    }
    try { await conn.write(enc.encode("a2 LOGOUT\r\n")); } catch { /* ignore */ }
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await supa.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.app_password ?? "").replace(/\s+/g, "");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), { status: 400, headers: corsHeaders });
    }
    if (password.length < 12) {
      return new Response(JSON.stringify({
        error: "invalid_password",
        message: "Gmail App Password is doorgaans 16 tekens. Verwijder spaties.",
      }), { status: 400, headers: corsHeaders });
    }

    console.log(`[email-app-password-link] user=${userId} email=${email} verifying SMTP+IMAP…`);
    try {
      await smtpAuthCheck("smtp.gmail.com", 465, email, password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[email-app-password-link] SMTP verify mislukt: ${msg}`);
      return new Response(JSON.stringify({
        error: "smtp_auth_failed",
        message: `SMTP-login mislukt: ${msg}. Controleer of 2-staps-verificatie aan staat en gebruik een App-wachtwoord (16 tekens).`,
      }), { status: 400, headers: corsHeaders });
    }
    try {
      await imapAuthCheck("imap.gmail.com", 993, email, password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[email-app-password-link] IMAP verify mislukt: ${msg}`);
      return new Response(JSON.stringify({
        error: "imap_auth_failed",
        message: `IMAP-login mislukt: ${msg}. Zorg dat IMAP aanstaat in Gmail-instellingen en gebruik hetzelfde app-wachtwoord.`,
      }), { status: 400, headers: corsHeaders });
    }
    console.log(`[email-app-password-link] SMTP+IMAP OK voor ${email}`);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userRow } = await admin.from("users").select("partner_id").eq("id", userId).maybeSingle();
    const partnerId = userRow?.partner_id ?? null;
    const encrypted = await encryptAppPassword(password);

    const { data: existing } = await admin
      .from("email_accounts")
      .select("id, access_token")
      .eq("user_id", userId).eq("provider", "google").maybeSingle();

    let accountId: string;
    if (existing) {
      const newMethod = existing.access_token ? "beide" : "app_password";
      const { data: upd, error: updErr } = await admin
        .from("email_accounts").update({
          email_adres: email,
          auth_method: newMethod,
          app_password_encrypted: encrypted,
          smtp_host: "smtp.gmail.com", smtp_port: 465,
          imap_host: "imap.gmail.com", imap_port: 993,
          actief: true, needs_reauth: false,
          last_send_error: null, last_send_error_at: null,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id).select("id").single();
      if (updErr) throw updErr;
      accountId = upd.id;
    } else {
      const { data: ins, error: insErr } = await admin
        .from("email_accounts").insert({
          user_id: userId, partner_id: partnerId,
          provider: "google", email_adres: email,
          auth_method: "app_password",
          app_password_encrypted: encrypted,
          smtp_host: "smtp.gmail.com", smtp_port: 465,
          imap_host: "imap.gmail.com", imap_port: 993,
          actief: true,
        }).select("id").single();
      if (insErr) throw insErr;
      accountId = ins.id;
    }

    return new Response(JSON.stringify({ ok: true, account_id: accountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: "internal", message: e instanceof Error ? e.message : "onbekend",
    }), { status: 500, headers: corsHeaders });
  }
});