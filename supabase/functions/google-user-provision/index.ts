import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Niet geautoriseerd" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user via their token
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Ongeldige sessie" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ success: true, already_exists: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract name from Google metadata
    const meta = user.user_metadata || {};
    const fullName = (meta.full_name || meta.name || "").trim();
    const nameParts = fullName.split(" ");
    const voornaam = nameParts[0] || user.email?.split("@")[0] || "Gebruiker";
    const achternaam = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Create a partner (trial) for this Google user
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .insert({
        naam: `${voornaam}${achternaam ? " " + achternaam : ""}`,
        email: user.email,
        status: "actief",
        abonnement_type: "trial",
        contract_startdatum: trialStart.toISOString().split("T")[0],
        trial_einddatum: trialEnd.toISOString().split("T")[0],
        contactpersoon_voornaam: voornaam,
        contactpersoon_achternaam: achternaam,
        contactpersoon_email: user.email,
        licentie_adviseurs: 2,
        licentie_installateurs: 2,
        trial_bron: "google_oauth",
        trial_aangemaakt_op: trialStart.toISOString(),
      })
      .select("id")
      .single();

    if (partnerError) {
      return new Response(
        JSON.stringify({ error: "Kon bedrijf niet aanmaken: " + partnerError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user profile as partner_admin
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: user.id,
      email: user.email || "",
      voornaam,
      achternaam,
      rol: "partner_admin",
      partner_id: partner.id,
      status: "actief",
    });

    if (profileError) {
      await supabaseAdmin.from("partners").delete().eq("id", partner.id);
      return new Response(
        JSON.stringify({ error: "Kon profiel niet aanmaken: " + profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, partner_id: partner.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
