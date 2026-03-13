import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { widget_id, voornaam, achternaam, email, telefoon, bericht, calculator_resultaat } = await req.json();

    // Input validation
    if (!widget_id || !voornaam || !achternaam || !email) {
      return new Response(
        JSON.stringify({ error: "Verplichte velden ontbreken: widget_id, voornaam, achternaam, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedVoornaam = String(voornaam).trim().slice(0, 100);
    const trimmedAchternaam = String(achternaam).trim().slice(0, 100);
    const trimmedEmail = String(email).trim().slice(0, 255).toLowerCase();
    const trimmedTelefoon = telefoon ? String(telefoon).trim().slice(0, 20) : null;
    const trimmedBericht = bericht ? String(bericht).trim().slice(0, 2000) : null;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: "Ongeldig e-mailadres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch widget to get partner_id, type, and notificatie_email
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from("web_widgets")
      .select("id, partner_id, type, actief, config, notificatie_email")
      .eq("id", widget_id)
      .single();

    if (widgetError || !widget) {
      return new Response(
        JSON.stringify({ error: "Widget niet gevonden" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!widget.actief) {
      return new Response(
        JSON.stringify({ error: "Widget is niet actief" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find partner_admin for this partner to use as owner_user_id
    const { data: partnerAdmin } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("partner_id", widget.partner_id)
      .eq("rol", "partner_admin")
      .eq("status", "actief")
      .limit(1)
      .single();

    if (!partnerAdmin) {
      return new Response(
        JSON.stringify({ error: "Geen actieve partner admin gevonden" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine bron based on widget type
    const bron = widget.type === "contactformulier"
      ? "website_contactformulier"
      : `website_${widget.type}`;

    // Build notities
    let notities = "";
    if (trimmedBericht) {
      notities += `Bericht: ${trimmedBericht}\n`;
    }
    if (calculator_resultaat) {
      notities += `\nCalculator resultaat:\n${JSON.stringify(calculator_resultaat, null, 2)}`;
    }
    if (widget.notificatie_email) {
      notities += `\nNotificatie e-mail: ${widget.notificatie_email}`;
    }

    // Create lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        partner_id: widget.partner_id,
        owner_user_id: partnerAdmin.id,
        voornaam: trimmedVoornaam,
        achternaam: trimmedAchternaam,
        email: trimmedEmail,
        telefoon: trimmedTelefoon,
        bron,
        notities: notities || null,
        lead_status: "nieuw",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Lead creation error:", leadError);
      return new Response(
        JSON.stringify({ error: "Kon lead niet aanmaken" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification for partner_admin
    const widgetLabel = widget.type === "contactformulier"
      ? "het contactformulier"
      : `de ${widget.type.replace("calculator_", "")} calculator`;

    await supabaseAdmin.from("notificaties").insert({
      user_id: partnerAdmin.id,
      titel: "Nieuwe lead via website widget",
      bericht: `${trimmedVoornaam} ${trimmedAchternaam} heeft contact opgenomen via ${widgetLabel} op uw website.`,
      type: "nieuwe_lead",
      entity_type: "leads",
      entity_id: lead.id,
    });

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Widget submit error:", err);
    return new Response(
      JSON.stringify({ error: "Interne serverfout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
