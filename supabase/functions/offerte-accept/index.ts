import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { share_token } = await req.json();
    if (!share_token) {
      return new Response(JSON.stringify({ error: "share_token is vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find offerte by share_token
    const { data: offerte, error: fetchErr } = await supabase
      .from("offertes")
      .select("id, status, share_expires_at, adviseur_id, offertenummer, klant_naam, klant_email, klant_telefoon, klant_adres, klant_postcode, klant_plaats, partner_id, lead_id, regels, totaal_bedrag")
      .eq("share_token", share_token)
      .single();

    if (fetchErr || !offerte) {
      return new Response(JSON.stringify({ error: "Offerte niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (offerte.share_expires_at && new Date(offerte.share_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Deze offertelink is verlopen" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check status
    if (offerte.status === "geaccepteerd") {
      return new Response(JSON.stringify({ error: "Deze offerte is al geaccepteerd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || "unknown";

    // Update offerte
    const { error: updateErr } = await supabase
      .from("offertes")
      .update({
        status: "geaccepteerd",
        accepted_at: new Date().toISOString(),
        accepted_ip: clientIp,
      })
      .eq("id", offerte.id);

    if (updateErr) throw updateErr;

    // Create opdracht automatically
    const { error: opdrachtErr } = await supabase.from("opdrachten").insert({
      partner_id: offerte.partner_id,
      offerte_id: offerte.id,
      lead_id: offerte.lead_id || null,
      klant_naam: offerte.klant_naam,
      klant_email: offerte.klant_email,
      klant_telefoon: offerte.klant_telefoon,
      klant_adres: offerte.klant_adres,
      klant_postcode: offerte.klant_postcode,
      klant_plaats: offerte.klant_plaats,
      regels: offerte.regels,
      totaal_bedrag: offerte.totaal_bedrag,
      status: "nieuw",
    });

    if (opdrachtErr) {
      console.error("Opdracht aanmaken mislukt:", opdrachtErr);
    }

    // Create notification for adviseur
    await supabase.from("notificaties").insert({
      user_id: offerte.adviseur_id,
      titel: "Offerte geaccepteerd",
      bericht: `${offerte.klant_naam} heeft offerte ${offerte.offertenummer} online geaccepteerd.`,
      type: "offerte_geaccepteerd",
      entity_type: "offertes",
      entity_id: offerte.id,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("offerte-accept error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
