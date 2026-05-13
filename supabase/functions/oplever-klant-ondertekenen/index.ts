import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPartnerNotifyRecipients, sendTransactionalBatch } from "../_shared/partner-notify-recipients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { token, naam, signature_image } = await req.json();
    if (!token || !naam || !signature_image) throw new Error("token, naam en handtekening verplicht");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rapport, error } = await admin
      .from("opleverrapporten")
      .select("id, partner_id, klant_token_expires_at, status")
      .eq("klant_token", token)
      .maybeSingle();
    if (error || !rapport) throw new Error("Rapport niet gevonden");
    if (rapport.status === "ondertekend") throw new Error("Rapport is al ondertekend");
    if (rapport.klant_token_expires_at && new Date(rapport.klant_token_expires_at) < new Date()) {
      throw new Error("Link is verlopen");
    }

    // Decode dataURL → upload
    const m = /^data:(.+?);base64,(.+)$/.exec(signature_image);
    if (!m) throw new Error("Ongeldig handtekening-formaat");
    const contentType = m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const path = `${rapport.partner_id}/${rapport.id}/klant-handtekening-${Date.now()}.png`;
    const { error: upErr } = await admin.storage.from("oplever-media").upload(path, bytes, {
      contentType,
      upsert: false,
    });
    if (upErr) throw upErr;

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "";

    const { error: uErr } = await admin
      .from("opleverrapporten")
      .update({
        klant_handtekening: { image_url: path, name: naam, signed_at: new Date().toISOString(), ip },
        status: "ondertekend",
        gefinaliseerd_op: new Date().toISOString(),
        klant_token: null,
        klant_token_expires_at: null,
      })
      .eq("id", rapport.id);
    if (uErr) throw uErr;

    await admin.from("opleverrapport_audit").insert({
      rapport_id: rapport.id,
      partner_id: rapport.partner_id,
      actie: "klant_ondertekend",
      details: { naam, ip },
    });

    // Notificeer partner-team
    try {
      const { data: full } = await admin
        .from("opleverrapporten")
        .select("rapportnummer")
        .eq("id", rapport.id)
        .maybeSingle();
      const recipients = await getPartnerNotifyRecipients(admin, rapport.partner_id);
      if (recipients.length > 0) {
        await sendTransactionalBatch(
          "oplever-ondertekend",
          recipients,
          `oplever-ondertekend-${rapport.id}`,
          {
            rapportnummer: full?.rapportnummer ?? undefined,
            klantNaam: naam,
            ondertekendOp: new Date().toLocaleDateString("nl-NL"),
          },
        );
      }
    } catch (e) {
      console.warn("oplever-ondertekend mail kon niet worden verzonden:", e);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
