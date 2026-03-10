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

    const { bedrijfsnaam, voornaam, achternaam, email, password, telefoon } = await req.json();

    // Validation
    if (!bedrijfsnaam || !voornaam || !achternaam || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Alle verplichte velden moeten worden ingevuld" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Wachtwoord moet minimaal 8 karakters zijn" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      const msg = authError.message.includes("already been registered")
        ? "Dit e-mailadres is al in gebruik"
        : authError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create partner (trial)
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .insert({
        naam: bedrijfsnaam,
        email,
        telefoonnummer: telefoon || null,
        status: "actief",
        abonnement_type: "trial",
        contract_startdatum: new Date().toISOString().split("T")[0],
        contactpersoon_voornaam: voornaam,
        contactpersoon_achternaam: achternaam,
        contactpersoon_email: email,
        contactpersoon_telefoon: telefoon || null,
        licentie_adviseurs: 2,
        licentie_installateurs: 2,
      })
      .select("id")
      .single();

    if (partnerError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Kon bedrijf niet aanmaken: " + partnerError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create user profile as partner_admin
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authUser.user.id,
      email,
      voornaam,
      achternaam,
      rol: "partner_admin",
      partner_id: partner.id,
      telefoon: telefoon || null,
      status: "actief",
    });

    if (profileError) {
      await supabaseAdmin.from("partners").delete().eq("id", partner.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Kon gebruiker niet aanmaken: " + profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email, partner_id: partner.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
