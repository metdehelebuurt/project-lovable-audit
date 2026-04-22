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
      financieel_document_id, ontvanger_email,
      html_body, subject: customSubject, attachment_path, attachment_filename,
      is_resend,
    } = body;

    if (!financieel_document_id || !ontvanger_email) {
      return jsonResponse({ error: "financieel_document_id en ontvanger_email zijn verplicht" }, 400);
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userRow } = await adminClient.from("users").select("partner_id").eq("id", userId).single();
    if (!userRow?.partner_id) return jsonResponse({ error: "Geen partner gekoppeld" }, 400);

    const { data: doc } = await adminClient.from("financiele_documenten")
      .select("id, documentnummer, type, klant_id, totaal_bedrag, status, partner_id, factuur_subtype, termijn_volgnummer, termijn_totaal")
      .eq("id", financieel_document_id).eq("partner_id", userRow.partner_id).single();
    if (!doc) return jsonResponse({ error: "Document niet gevonden" }, 404);

    const { data: partner } = await adminClient.from("partners")
      .select("naam, afzender_naam").eq("id", userRow.partner_id).single();

    const docLabel = doc.factuur_subtype === "voorschot"
      ? "Voorschotfactuur"
      : doc.factuur_subtype === "eindafrekening"
        ? "Eindafrekening"
        : "Factuur";
    const termijnSuffix = doc.factuur_subtype === "voorschot" && doc.termijn_volgnummer && doc.termijn_totaal
      ? ` (termijn ${doc.termijn_volgnummer} van ${doc.termijn_totaal})`
      : "";
    const baseSubject = customSubject || `${docLabel} ${doc.documentnummer}${termijnSuffix} — ${partner?.afzender_naam || partner?.naam || ""}`;
    const subject = is_resend && !customSubject ? `[Herinnering] ${baseSubject}` : baseSubject;
    const html = html_body || `<div style="font-family:sans-serif;padding:20px;"><p>Beste klant,</p><p>Hierbij ontvangt u onze ${docLabel.toLowerCase()} <strong>${doc.documentnummer}</strong>${termijnSuffix}.</p><p>Met vriendelijke groet,<br/>${partner?.afzender_naam || partner?.naam || ""}</p></div>`;

    const attachment = attachment_path
      ? await fetchAttachment(adminClient, attachment_path, attachment_filename || `${doc.documentnummer}.pdf`)
      : null;

    const emailType = doc.factuur_subtype === "voorschot" ? "voorschotfactuur"
      : doc.factuur_subtype === "eindafrekening" ? "eindafrekening" : "factuur";

    await sendPartnerEmail({
      adminClient, partnerId: userRow.partner_id, to: ontvanger_email,
      subject, html, attachment, type: emailType,
      klantId: doc.klant_id || null, verzondenDoorId: userId,
    });

    // Historie-entry voor verzonden/opnieuw verzonden
    await adminClient.from("factuur_historie").insert({
      financieel_document_id, partner_id: userRow.partner_id, actor_id: userId,
      actie: is_resend ? "opnieuw_verzonden" : "verzonden",
      notitie: ontvanger_email,
      metadata: { onderwerp: subject },
    });

    if (!is_resend && doc.status === "concept") {
      await adminClient.from("financiele_documenten")
        .update({ status: "verzonden", verzonden_op: new Date().toISOString() })
        .eq("id", financieel_document_id);
    }

    if (attachment_path) {
      await adminClient.storage.from("email-bijlagen").remove([attachment_path]);
    }

    return jsonResponse({ success: true });
  } catch (err: any) {
    console.error("send-factuur-email error:", err);
    if (err instanceof PartnerEmailError) return jsonResponse({ error: err.message }, err.status);
    return jsonResponse({ error: err.message || "Interne fout" }, 500);
  }
});