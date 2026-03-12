import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller's profile
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("rol, partner_id")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.partner_id) {
      return new Response(JSON.stringify({ error: "Profiel niet gevonden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only partner_admin can clear demo data
    if (profile.rol !== "partner_admin" && profile.rol !== "superadmin") {
      return new Response(JSON.stringify({ error: "Geen rechten" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pid = profile.partner_id;

    // Delete demo data in correct order (respecting FK constraints)
    // Demo data is identified by "⚡ Demo:" prefix in notities/omschrijving fields

    // 1. Installaties with demo notities
    await supabaseAdmin.from("installaties").delete()
      .eq("partner_id", pid).like("notities", "⚡ Demo:%");

    // 2. Offertes with demo notities
    await supabaseAdmin.from("offertes").delete()
      .eq("partner_id", pid).like("notities", "⚡ Demo:%");

    // 3. Schouwen with demo notities
    await supabaseAdmin.from("schouwen").delete()
      .eq("partner_id", pid).like("notities", "⚡ Demo:%");

    // 4. Leads with demo notities
    await supabaseAdmin.from("leads").delete()
      .eq("partner_id", pid).like("notities", "⚡ Demo:%");

    // 5. Producten with demo omschrijving
    await supabaseAdmin.from("producten").delete()
      .eq("partner_id", pid).like("omschrijving", "⚡ Demo:%");

    return new Response(
      JSON.stringify({ success: true, message: "Demogegevens verwijderd" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
