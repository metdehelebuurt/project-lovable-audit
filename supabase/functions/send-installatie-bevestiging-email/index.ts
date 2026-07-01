// Verstuurt een installatie-/afspraakbevestiging naar de klant.
// Gebruikt de gedeelde partner-email sender (OAuth of Gmail App Password).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPartnerEmail, PartnerEmailError } from "../_shared/partner-email-send.ts";
import { loadPartnerBrand, wrapInPartnerTemplate } from "../_shared/partner-branded-email.ts";

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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  const paragraphs = text.split("\n").map((l) => {
    if (!l.trim()) return "<p>&nbsp;</p>";
    return `<p style="margin:0 0 10px 0;">${escapeHtml(l)}</p>`;
  }).join("");
  return paragraphs;
}

function formatDate(d?: string | null): string {
  if (!d) return "in overleg";
  try {
    return new Date(d).toLocaleDateString("nl-NL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return d; }
}

function formatTime(t?: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Niet ingelogd" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Niet ingelogd" }, 401);

    const userId = claimsData.claims.sub as string;

    let body: any;
    try { body = await req.json(); } catch { return jsonResponse({ error: "Ongeldige request body" }, 400); }

    const {
      installatie_id,
      ontvanger_email,
      cc,
      bcc,
      subject: customSubject,
      html_body: customHtml,
      text_body: customText,
    } = body ?? {};

    if (!installatie_id || typeof installatie_id !== "string") {
      return jsonResponse({ error: "installatie_id is verplicht" }, 400);
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userRow, error: userErr } = await adminClient
      .from("users").select("partner_id").eq("id", userId).maybeSingle();
    if (userErr || !userRow?.partner_id) return jsonResponse({ error: "Geen partner gekoppeld aan gebruiker" }, 400);

    const { data: installatie, error: instErr } = await adminClient
      .from("installaties")
      .select("id, partner_id, klant_id, consument_id, consument_naam, klant_email, klant_adres, werkadres, geplande_startdatum, start_tijd, eind_tijd, werkomschrijving, status, bevestiging_verzonden_op, installatienummer")
      .eq("id", installatie_id)
      .eq("partner_id", userRow.partner_id)
      .maybeSingle();
    if (instErr) return jsonResponse({ error: `DB-fout: ${instErr.message}` }, 500);
    if (!installatie) return jsonResponse({ error: "Installatie niet gevonden of geen toegang" }, 404);

    const to = (ontvanger_email || installatie.klant_email || "").trim();
    if (!to) return jsonResponse({ error: "Geen ontvanger e-mailadres. Vul het klant-e-mailadres in of vul de gegevens aan." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return jsonResponse({ error: `Ongeldig e-mailadres: ${to}` }, 400);

    const brand = await loadPartnerBrand(adminClient, userRow.partner_id);

    const datum = formatDate(installatie.geplande_startdatum);
    const startTijd = formatTime(installatie.start_tijd);
    const eindTijd = formatTime(installatie.eind_tijd);
    const tijd = startTijd
      ? (eindTijd ? `${startTijd} – ${eindTijd}` : `vanaf ${startTijd}`)
      : "in overleg";
    const adres = installatie.werkadres ?? installatie.klant_adres ?? "";

    const orgNaam = brand?.afzender_naam || brand?.naam || "";
    const nummer = installatie.installatienummer ?? "";

    const defaultSubject = `Bevestiging installatieafspraak${nummer ? ` — ${nummer}` : ""}`;
    const defaultText =
`Beste ${installatie.consument_naam ?? "klant"},

Hierbij bevestigen wij uw installatieafspraak.

Datum: ${datum}
Tijd: ${tijd}
Locatie: ${adres || "in overleg"}
${installatie.werkomschrijving ? `\nWerkzaamheden: ${installatie.werkomschrijving}\n` : ""}
Mocht u vragen hebben of de afspraak willen wijzigen, neem dan gerust contact met ons op.

Met vriendelijke groet,
${orgNaam}`;

    const subject = (typeof customSubject === "string" && customSubject.trim()) ? customSubject.trim() : defaultSubject;
    const innerHtml = (typeof customHtml === "string" && customHtml.trim())
      ? customHtml
      : textToHtml(typeof customText === "string" && customText.trim() ? customText : defaultText);
    // Strip default signature uit body zodat template die netjes rendert
    const bodyZonderGroet = innerHtml
      .replace(/<p[^>]*>\s*Met vriendelijke groet,?\s*<\/p>\s*(<p[^>]*>[^<]*<\/p>)?/i, "")
      .replace(/Met vriendelijke groet,?\s*\n?[^\n<]*$/i, "");
    const html = wrapInPartnerTemplate({
      brand,
      bodyHtml: bodyZonderGroet,
      senderName: orgNaam || null,
      preheader: `Uw installatieafspraak op ${datum}`,
    });

    try {
      const result = await sendPartnerEmail({
        adminClient,
        partnerId: userRow.partner_id,
        to,
        cc: Array.isArray(cc) ? cc.filter(Boolean) : [],
        bcc: Array.isArray(bcc) ? bcc.filter(Boolean) : [],
        subject,
        html,
        attachment: null,
        type: "installatie_bevestiging",
        klantId: installatie.klant_id ?? null,
        verzondenDoorId: userId,
        documentType: "algemeen",
      });

      const updates: Record<string, unknown> = {
        bevestiging_verzonden_op: new Date().toISOString(),
      };
      if (installatie.status === "gepland") updates.status = "bevestigd";

      const { error: updErr } = await adminClient.from("installaties")
        .update(updates).eq("id", installatie_id);
      if (updErr) console.error("Installatie update mislukt:", updErr);

      // Historie-log (best effort)
      await adminClient.from("installatie_historie").insert({
        installatie_id,
        partner_id: userRow.partner_id,
        actor_id: userId,
        actie: "bevestiging_verzonden",
        veld: "bevestiging_verzonden_op",
        nieuwe_waarde: `${to} — ${subject}`,
      }).then(({ error: histErr }) => {
        if (histErr) console.log("historie insert overgeslagen:", histErr.message);
      });

      return jsonResponse({ success: true, provider: result.provider, from: result.from, to });
    } catch (err) {
      if (err instanceof PartnerEmailError) {
        return jsonResponse({ error: err.message }, err.status);
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error("send-installatie-bevestiging-email error:", msg);
      return jsonResponse({ error: msg || "E-mail verzenden mislukt" }, 500);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("send-installatie-bevestiging-email fatal:", msg);
    return jsonResponse({ error: msg || "Interne fout" }, 500);
  }
});