import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { share_token, reden, categorie } = await req.json();
    if (!share_token) return new Response(JSON.stringify({ error: "Token ontbreekt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find offerte by token
    const { data: offerte, error: fetchErr } = await supabase
      .from("offertes")
      .select("id, offertenummer, klant_naam, adviseur_id, status, share_token, share_expires_at")
      .eq("share_token", share_token)
      .single();

    if (fetchErr || !offerte) {
      return new Response(JSON.stringify({ error: "Offerte niet gevonden" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (offerte.share_expires_at && new Date(offerte.share_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Deze link is verlopen" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (offerte.status === "geaccepteerd") {
      return new Response(JSON.stringify({ error: "Deze offerte is al geaccepteerd" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (offerte.status === "afgewezen") {
      return new Response(JSON.stringify({ error: "Deze offerte is al afgewezen" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update offerte
    const { error: updateErr } = await supabase
      .from("offertes")
      .update({
        status: "afgewezen",
        afwijzing_reden: reden || null,
        afwijzing_categorie: categorie || null,
      })
      .eq("id", offerte.id);

    if (updateErr) throw updateErr;

    // Create notification for adviseur
    if (offerte.adviseur_id) {
      await supabase.from("notificaties").insert({
        user_id: offerte.adviseur_id,
        titel: "Offerte afgewezen door klant",
        bericht: `Klant ${offerte.klant_naam} heeft offerte ${offerte.offertenummer} afgewezen. Reden: ${categorie || "Niet opgegeven"}${reden ? ` — ${reden}` : ""}`,
        type: "status_wijziging",
        entity_type: "offertes",
        entity_id: offerte.id,
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("offerte-reject error:", e);
    return new Response(JSON.stringify({ error: "Er is een fout opgetreden" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
