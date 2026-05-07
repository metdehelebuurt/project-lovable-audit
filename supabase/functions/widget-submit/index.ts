import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      widget_id,
      voornaam,
      achternaam,
      email,
      telefoon,
      bericht,
      calculator_resultaat,
      product_id,
      product_naam,
    } = await req.json();

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
      .select("id, email")
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

    // Productcatalogus: koppel webshop bron en (optioneel) maak conceptofferte
    let conceptOfferteId: string | null = null;
    if (product_id) {
      // Log webshop bron
      await supabaseAdmin.from("webshop_lead_bron").insert({
        lead_id: lead.id,
        partner_id: widget.partner_id,
        product_id,
        product_naam: product_naam ?? null,
        widget_id: widget.id,
        bron: "webshop",
      });

      // Haal product op (alleen als toon_op_website)
      const { data: product } = await supabaseAdmin
        .from("producten")
        .select("id, naam, prijs_excl_btw, btw_percentage, eenheid, toon_op_website, partner_id")
        .eq("id", product_id)
        .eq("partner_id", widget.partner_id)
        .eq("toon_op_website", true)
        .maybeSingle();

      if (product) {
        const prijs = Number(product.prijs_excl_btw ?? 0);
        const btwPct = Number(product.btw_percentage ?? 21);
        const subtotaal = prijs;
        const btwBedrag = +(subtotaal * (btwPct / 100)).toFixed(2);
        const totaal = +(subtotaal + btwBedrag).toFixed(2);

        const regels = [
          {
            product_id: product.id,
            omschrijving: product.naam,
            aantal: 1,
            eenheid: product.eenheid ?? "stuks",
            prijs_excl_btw: prijs,
            btw_percentage: btwPct,
            korting_euro: 0,
            korting_percentage: 0,
            totaal: prijs,
          },
        ];

        const { data: offerte } = await supabaseAdmin
          .from("offertes")
          .insert({
            partner_id: widget.partner_id,
            adviseur_id: partnerAdmin.id,
            lead_id: lead.id,
            klant_voornaam: trimmedVoornaam,
            klant_achternaam: trimmedAchternaam,
            klant_email: trimmedEmail,
            klant_telefoon: trimmedTelefoon,
            status: "concept",
            regels,
            subtotaal,
            btw_bedrag: btwBedrag,
            totaal_bedrag: totaal,
            notities: `Automatische conceptofferte aangemaakt op basis van productaanvraag via website${
              product_naam ? ` (${product_naam})` : ""
            }.`,
          })
          .select("id")
          .maybeSingle();

        if (offerte) {
          conceptOfferteId = offerte.id;
        }
      }
    }

    // Create notification for partner_admin
    const widgetLabel = widget.type === "contactformulier"
      ? "het contactformulier"
      : widget.type === "productcatalogus"
      ? "de productcatalogus"
      : `de ${widget.type.replace("calculator_", "")} calculator`;

    const productSuffix = product_naam ? ` voor product "${product_naam}"` : "";
    await supabaseAdmin.from("notificaties").insert({
      user_id: partnerAdmin.id,
      titel: "Nieuwe lead via website widget",
      bericht: `${trimmedVoornaam} ${trimmedAchternaam} heeft contact opgenomen via ${widgetLabel}${productSuffix}.${
        conceptOfferteId ? " Er is automatisch een conceptofferte aangemaakt." : ""
      }`,
      type: "nieuwe_lead",
      entity_type: "leads",
      entity_id: lead.id,
    });

    // Stuur e-mailnotificatie naar de partner via diens eigen
    // e-mailkoppeling (Gmail / Outlook / SMTP). Valt terug op
    // het systeem (Lovable transactional) als er nog geen
    // mailkoppeling is.
    try {
      const recipient = (widget.notificatie_email && String(widget.notificatie_email).trim())
        || partnerAdmin.email;
      if (recipient) {
        const siteUrl = Deno.env.get("SITE_URL") || "https://mijnhuis.nu";
        const subject = `Nieuwe lead via website: ${trimmedVoornaam} ${trimmedAchternaam}`;
        const rows: string[] = [];
        rows.push(`<p><strong>Naam:</strong> ${escapeHtml(`${trimmedVoornaam} ${trimmedAchternaam}`)}</p>`);
        rows.push(`<p><strong>E-mail:</strong> ${escapeHtml(trimmedEmail)}</p>`);
        if (trimmedTelefoon) rows.push(`<p><strong>Telefoon:</strong> ${escapeHtml(trimmedTelefoon)}</p>`);
        if (product_naam) rows.push(`<p><strong>Product:</strong> ${escapeHtml(String(product_naam))}</p>`);
        if (bron) rows.push(`<p><strong>Bron:</strong> ${escapeHtml(bron)}</p>`);
        if (trimmedBericht) rows.push(`<p><strong>Bericht:</strong><br/>${escapeHtml(trimmedBericht).replace(/\n/g,"<br/>")}</p>`);
        const html = `
          <div style="font-family:Inter,Arial,sans-serif;color:#222;max-width:560px">
            <h2 style="margin:0 0 12px">Nieuwe lead binnen</h2>
            <p style="color:#555">Er is via je website een nieuwe lead binnengekomen.</p>
            <div style="background:#f6f6f9;padding:14px 18px;border-radius:10px;margin:12px 0">${rows.join("")}</div>
            <p><a href="${siteUrl}/leads/${lead.id}" style="background:#5B58E1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Bekijk lead</a></p>
          </div>
        `;

        // Probeer eerst via partner-email (Gmail/Outlook/SMTP koppeling).
        let usedPartnerEmail = false;
        try {
          const { sendPartnerEmail } = await import("../_shared/partner-email-send.ts");
          await sendPartnerEmail({
            adminClient: supabaseAdmin,
            partnerId: widget.partner_id,
            to: recipient,
            subject,
            html,
            type: "nieuwe_lead",
            leadId: lead.id,
          });
          usedPartnerEmail = true;
        } catch (partnerMailErr) {
          console.warn("Partner email mislukt, fallback naar systeem:", partnerMailErr);
        }

        if (!usedPartnerEmail) {
          await supabaseAdmin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "nieuwe-lead",
              recipientEmail: recipient,
              idempotencyKey: `nieuwe-lead-${lead.id}`,
              templateData: {
                voornaam: trimmedVoornaam,
                achternaam: trimmedAchternaam,
                email: trimmedEmail,
                telefoon: trimmedTelefoon,
                bron,
                bericht: trimmedBericht,
                productNaam: product_naam ?? null,
                leadUrl: `${siteUrl}/leads/${lead.id}`,
              },
            },
          });
        }
      }
    } catch (mailErr) {
      console.error("Email notificatie nieuwe lead mislukt:", mailErr);
    }


    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id, concept_offerte_id: conceptOfferteId }),
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
