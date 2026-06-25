// Edge function: koppel Gmail via App-wachtwoord. Valideert SMTP-login,
// versleutelt het wachtwoord en slaat het op in email_accounts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptAppPassword } from "../_shared/email-crypto.ts";
import { smtpVerify } from "../_shared/smtp-send.ts";

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

    try {
      await smtpVerify({
        email_adres: email,
        smtp_host: "smtp.gmail.com", smtp_port: 465,
        app_password_plain: password,
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: "smtp_auth_failed",
        message: e instanceof Error ? e.message : "SMTP-login mislukt. Controleer e-mail en app-wachtwoord.",
      }), { status: 400, headers: corsHeaders });
    }

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