import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAttachment } from "../_shared/email-send.ts";
import { sendPartnerEmail, PartnerEmailError } from "../_shared/partner-email-send.ts";

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
      cc, bcc,
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
      .select("naam, afzender_naam").eq("id", userRow.partner_id).single();

    const subject = customSubject || `Orderbevestiging — ${partner?.afzender_naam || partner?.naam || ""}`;
    const html = html_body || `<div style="font-family:sans-serif;padding:20px;"><p>Beste ${opdracht.klant_naam || "klant"},</p><p>Hierbij ontvangt u onze orderbevestiging.</p><p>Met vriendelijke groet,<br/>${partner?.afzender_naam || partner?.naam || ""}</p></div>`;

    const attachment = attachment_path
      ? await fetchAttachment(adminClient, attachment_path, attachment_filename || `orderbevestiging-${opdracht_id}.pdf`)
      : null;

    await sendPartnerEmail({
      adminClient, partnerId: userRow.partner_id, to: ontvanger_email,
      cc: Array.isArray(cc) ? cc : [],
      bcc: Array.isArray(bcc) ? bcc : [],
      subject, html, attachment, type: "orderbevestiging",
      klantId: opdracht.klant_id || null, verzondenDoorId: userId,
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
    if (err instanceof PartnerEmailError) return jsonResponse({ error: err.message }, err.status);
    return jsonResponse({ error: err.message || "Interne fout" }, 500);
  }
});