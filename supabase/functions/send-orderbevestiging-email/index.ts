import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sendViaSMTP, sendViaGmailApi, sendViaMsGraphApi,
  refreshOAuthToken, fetchAttachment,
} from "../_shared/email-send.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const {
      opdracht_id, ontvanger_email,
      html_body, subject: customSubject, attachment_path, attachment_filename,
    } = body;

    if (!opdracht_id || !ontvanger_email) {
      return jsonResponse({ error: "opdracht_id en ontvanger_email zijn verplicht" }, 400);
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userRow } = await adminClient.from("users").select("partner_id").eq("id", userId).single();
    if (!userRow?.partner_id) return jsonResponse({ error: "Geen partner gekoppeld" }, 400);

    const { data: opdracht } = await adminClient.from("opdrachten")
      .select("id, klant_id, klant_naam, status, partner_id, bevestiging_verzonden_op")
      .eq("id", opdracht_id).eq("partner_id", userRow.partner_id).single();
    if (!opdracht) return jsonResponse({ error: "Opdracht niet gevonden" }, 404);

    const { data: partner } = await adminClient.from("partners")
      .select("naam, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, afzender_email, afzender_naam, email_provider")
      .eq("id", userRow.partner_id).single();
    if (!partner) return jsonResponse({ error: "Partner niet gevonden" }, 404);

    const { data: emailAccount } = await adminClient.from("email_accounts")
      .select("*").eq("partner_id", userRow.partner_id).eq("actief", true).maybeSingle();

    const useOAuth = emailAccount && (partner.email_provider === "oauth_google" || partner.email_provider === "oauth_microsoft");
    if (!useOAuth && (!partner.smtp_host || !partner.afzender_email)) {
      return jsonResponse({ error: "E-mailconfiguratie is niet ingesteld." }, 400);
    }

    const subject = customSubject || `Orderbevestiging — ${partner.afzender_naam || partner.naam}`;
    const html = html_body || `<div style="font-family:sans-serif;padding:20px;"><p>Beste ${opdracht.klant_naam || "klant"},</p><p>Hierbij ontvangt u onze orderbevestiging.</p><p>Met vriendelijke groet,<br/>${partner.afzender_naam || partner.naam}</p></div>`;

    const attachment = attachment_path
      ? await fetchAttachment(adminClient, attachment_path, attachment_filename || `orderbevestiging-${opdracht_id}.pdf`)
      : null;

    if (useOAuth) {
      let accessToken = emailAccount.access_token;
      if (new Date(emailAccount.token_expiry) <= new Date()) {
        accessToken = await refreshOAuthToken(adminClient, emailAccount);
      }
      if (emailAccount.provider === "google") {
        await sendViaGmailApi({ accessToken, from: emailAccount.email_adres, to: ontvanger_email, subject, html, attachment });
      } else {
        await sendViaMsGraphApi({ accessToken, to: ontvanger_email, subject, html, attachment });
      }
      await adminClient.from("email_berichten").insert({
        email_account_id: emailAccount.id, partner_id: userRow.partner_id,
        richting: "uitgaand", van: emailAccount.email_adres, aan: ontvanger_email,
        onderwerp: subject, body_html: html, datum: new Date().toISOString(),
        is_gelezen: true, klant_id: opdracht.klant_id || null,
      });
    } else {
      await sendViaSMTP({
        host: partner.smtp_host!, port: partner.smtp_port || 587,
        user: partner.smtp_user!, pass: partner.smtp_pass_encrypted!,
        from: partner.afzender_email!, fromName: partner.afzender_naam || partner.naam,
        to: ontvanger_email, subject, html, attachment,
      });
    }

    await adminClient.from("email_log").insert({
      partner_id: userRow.partner_id,
      ontvanger_email, onderwerp: subject, html_body: html,
      status: "verzonden", type: "orderbevestiging", verzonden_door_id: userId,
    });

    if (!opdracht.bevestiging_verzonden_op) {
      await adminClient.from("opdrachten")
        .update({ status: "bevestigd", bevestiging_verzonden_op: new Date().toISOString() })
        .eq("id", opdracht_id);
    }

    if (attachment_path) {
      await adminClient.storage.from("email-bijlagen").remove([attachment_path]);
    }

    return jsonResponse({ success: true });
  } catch (err: any) {
    console.error("send-orderbevestiging-email error:", err);
    return jsonResponse({ error: err.message || "Interne fout" }, 500);
  }
});