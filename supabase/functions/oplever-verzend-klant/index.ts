import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { rapport_id } = await req.json();
    if (!rapport_id) throw new Error("rapport_id verplicht");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rapport, error: rErr } = await admin
      .from("opleverrapporten")
      .select("id, partner_id, rapportnummer, klant_id")
      .eq("id", rapport_id)
      .single();
    if (rErr || !rapport) throw new Error(rErr?.message ?? "Rapport niet gevonden");

    const token = crypto.randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + 14);

    const { error: uErr } = await admin
      .from("opleverrapporten")
      .update({ klant_token: token, klant_token_expires_at: expires.toISOString(), status: "wacht_op_klant" })
      .eq("id", rapport_id);
    if (uErr) throw uErr;

    let klantEmail: string | null = null;
    let klantNaam: string | null = null;
    if (rapport.klant_id) {
      const { data: klant } = await admin.from("klanten").select("email, voornaam, achternaam").eq("id", rapport.klant_id).maybeSingle();
      klantEmail = klant?.email ?? null;
      klantNaam = klant ? `${klant.voornaam ?? ""} ${klant.achternaam ?? ""}`.trim() : null;
    }

    const origin = req.headers.get("origin") ?? "";
    const link = `${origin}/oplevering/${token}`;

    await admin.from("opleverrapport_audit").insert({
      rapport_id,
      partner_id: rapport.partner_id,
      actie: "verzonden_naar_klant",
      details: { klantEmail, link_expires: expires.toISOString() },
    });

    // Email versturen via send-transactional-email indien beschikbaar
    if (klantEmail) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "oplever-klant-ondertekenen",
            recipientEmail: klantEmail,
            idempotencyKey: `oplever-${rapport_id}-${token.slice(0, 8)}`,
            templateData: { name: klantNaam ?? "", link, rapportnummer: rapport.rapportnummer },
          },
        });
      } catch (e) {
        console.warn("Mail-trigger faalde (template ontbreekt vermoedelijk):", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, token, link }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
