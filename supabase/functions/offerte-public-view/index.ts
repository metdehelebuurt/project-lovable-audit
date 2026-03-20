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
    if (!share_token || typeof share_token !== "string") {
      return new Response(JSON.stringify({ error: "share_token is vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch offerte by share_token
    const { data: offerte, error: offerteErr } = await supabase
      .from("offertes")
      .select("*")
      .eq("share_token", share_token)
      .single();

    if (offerteErr || !offerte) {
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

    // Fetch partner branding (only safe fields)
    let partner = null;
    if (offerte.partner_id) {
      const { data: p } = await supabase
        .from("partners")
        .select("naam, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan, telefoonnummer, email, website, adres, postcode, plaats, kvk, btw")
        .eq("id", offerte.partner_id)
        .single();
      if (p) partner = p;
    }

    // Fetch schouw data if linked
    let schouw = null;
    if (offerte.schouw_id) {
      const { data: s } = await supabase
        .from("schouwen")
        .select("schouw_nummer, categorie, geplande_datum, status, consument_naam, gegevens, notities, aandachtspunten")
        .eq("id", offerte.schouw_id)
        .single();
      if (s) schouw = s;
    }

    return new Response(JSON.stringify({ offerte, partner, schouw }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("offerte-public-view error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
