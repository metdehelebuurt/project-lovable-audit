// Verstuurt een inkooporder als PDF-bijlage naar de leverancier.
// HARDE EIS: alleen via het persoonlijke OAuth-mailaccount van de ingelogde
// gebruiker (Gmail of Outlook). Geen partner-SMTP-fallback — communicatie naar
// leveranciers gaat ALTIJD vanuit de gebruiker zelf.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAttachment } from "../_shared/email-send.ts";
import { sendUserEmail, UserMailboxError } from "../_shared/user-email-send.ts";

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
      inkooporder_id, ontvanger_email,
      html_body, subject: customSubject,
      attachment_path, attachment_filename,
      is_resend,
    } = body ?? {};

    if (!inkooporder_id || !ontvanger_email) {
      return jsonResponse({ error: "inkooporder_id en ontvanger_email zijn verplicht" }, 400);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userRow } = await adminClient
      .from("users").select("partner_id, rol").eq("id", userId).single();
    if (!userRow?.partner_id) return jsonResponse({ error: "Geen organisatie gekoppeld" }, 400);

    const { data: doc } = await adminClient.from("financiele_documenten")
      .select("id, documentnummer, type, leverancier_id, totaal_bedrag, status, partner_id, goedgekeurd_op")
      .eq("id", inkooporder_id).eq("partner_id", userRow.partner_id).single();
    if (!doc) return jsonResponse({ error: "Inkooporder niet gevonden" }, 404);
    if (doc.type !== "inkooporder") {
      return jsonResponse({ error: "Document is geen inkooporder" }, 400);
    }

    // Goedkeuringscheck: lees instellingen
    const { data: instellingen } = await adminClient
      .from("inkoop_instellingen")
      .select("goedkeuring_modus, goedkeuring_drempel_bedrag")
      .eq("partner_id", userRow.partner_id)
      .maybeSingle();

    const modus = (instellingen?.goedkeuring_modus ?? "geen") as string;
    const drempel = Number(instellingen?.goedkeuring_drempel_bedrag ?? 0);
    const totaal = Number(doc.totaal_bedrag ?? 0);
    const moetGoedgekeurd =
      (modus === "altijd") ||
      (modus === "drempel" && totaal >= drempel && drempel > 0);

    if (moetGoedgekeurd && !doc.goedgekeurd_op) {
      return jsonResponse({
        error: "Deze inkooporder moet eerst worden goedgekeurd voordat hij verzonden kan worden.",
      }, 403);
    }

    const { data: partner } = await adminClient.from("partners")
      .select("naam, afzender_naam").eq("id", userRow.partner_id).single();
    const { data: leverancier } = doc.leverancier_id
      ? await adminClient.from("leveranciers")
          .select("naam, contactpersoon").eq("id", doc.leverancier_id).single()
      : { data: null };

    const baseSubject = customSubject ||
      `Inkooporder ${doc.documentnummer} — ${partner?.afzender_naam || partner?.naam || ""}`;
    const subject = is_resend && !customSubject ? `[Herinnering] ${baseSubject}` : baseSubject;

    const bodyTrimmed = typeof html_body === "string" ? html_body.trim() : "";
    const fallbackHtml = `<div style="font-family:sans-serif;padding:20px;">
      <p>Beste${leverancier?.contactpersoon ? ` ${leverancier.contactpersoon}` : " relatie"},</p>
      <p>Hierbij ontvangt u${is_resend ? " nogmaals" : ""} onze inkooporder
        <strong>${doc.documentnummer}</strong>${leverancier?.naam ? ` voor ${leverancier.naam}` : ""}.</p>
      <p>Graag uw bevestiging van de bestelling en de verwachte leverdatum.</p>
      <p>Met vriendelijke groet,<br/>${partner?.afzender_naam || partner?.naam || ""}</p>
    </div>`;
    const html = bodyTrimmed.length > 0 ? html_body : fallbackHtml;

    let attachment = null;
    if (attachment_path) {
      attachment = await fetchAttachment(
        adminClient, attachment_path,
        attachment_filename || `Inkooporder-${doc.documentnummer}.pdf`,
      );
      if (!attachment) {
        await adminClient.from("email_log").insert({
          partner_id: userRow.partner_id,
          ontvanger_email,
          onderwerp: subject,
          type: "inkooporder",
          status: "mislukt",
          error_message: `Bijlage ${attachment_path} kon niet worden gedownload uit email-bijlagen`,
          html_body: html,
          verzonden_door_id: userId,
        });
        return jsonResponse({
          error: "PDF-bijlage kon niet worden opgehaald. Genereer het document opnieuw en probeer het nogmaals.",
        }, 400);
      }
    }

    // Verzending uitsluitend via persoonlijke OAuth-mailbox van de gebruiker
    let result;
    try {
      result = await sendUserEmail({
        adminClient,
        userId,
        partnerId: userRow.partner_id,
        to: ontvanger_email,
        subject, html, attachment,
        type: "inkooporder",
        inkooporderId: inkooporder_id,
      });
    } catch (err) {
      if (err instanceof UserMailboxError) {
        return jsonResponse({ error: err.message }, err.status);
      }
      throw err;
    }

    // Audit + status-update
    const updates: Record<string, unknown> = {
      verzonden_op: new Date().toISOString(),
      verzonden_door_id: userId,
      verzonden_via: result.provider,
    };
    if (!is_resend && doc.status === "concept") {
      updates.status = "verzonden";
    }
    await adminClient.from("financiele_documenten")
      .update(updates).eq("id", inkooporder_id);

    await adminClient.from("factuur_historie").insert({
      financieel_document_id: inkooporder_id,
      partner_id: userRow.partner_id,
      actor_id: userId,
      actie: is_resend ? "opnieuw_verzonden" : "verzonden",
      notitie: ontvanger_email,
      metadata: {
        onderwerp: subject,
        heeft_bijlage: !!attachment,
        provider: result.provider,
        from: result.from,
      },
    });

    if (attachment_path) {
      try {
        await adminClient.storage.from("email-bijlagen").remove([attachment_path]);
      } catch (cleanupErr) {
        console.warn("Cleanup email-bijlagen mislukt (niet kritiek):", cleanupErr);
      }
    }

    return jsonResponse({
      success: true,
      provider: result.provider,
      from: result.from,
      heeft_bijlage: !!attachment,
    });
  } catch (err: any) {
    console.error("inkoop-verzend-leverancier error:", err);
    return jsonResponse({ error: err?.message || "Interne fout" }, 500);
  }
});