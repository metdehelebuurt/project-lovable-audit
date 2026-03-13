import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendViaSMTP(
  host: string,
  port: number,
  user: string,
  pass: string,
  from: string,
  fromName: string,
  to: string,
  subject: string,
  html: string
) {
  // Use Deno's built-in SMTP via denopkg
  const { SMTPClient } = await import(
    "https://deno.land/x/denomailer@1.6.0/mod.ts"
  );

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  });

  await client.send({
    from: `${fromName} <${from}>`,
    to,
    subject,
    content: "auto",
    html,
  });

  await client.close();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const { action } = body;

    // Get user's partner
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userRow } = await adminClient
      .from("users")
      .select("partner_id, rol")
      .eq("id", userId)
      .single();

    if (!userRow?.partner_id) {
      return new Response(JSON.stringify({ error: "Geen partner gekoppeld" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get partner SMTP config
    const { data: partner } = await adminClient
      .from("partners")
      .select(
        "naam, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, afzender_email, afzender_naam"
      )
      .eq("id", userRow.partner_id)
      .single();

    if (!partner) {
      return new Response(JSON.stringify({ error: "Partner niet gevonden" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Test action
    if (action === "test") {
      if (!partner.smtp_host || !partner.afzender_email || !partner.smtp_user || !partner.smtp_pass_encrypted) {
        return new Response(
          JSON.stringify({ error: "SMTP-instellingen zijn niet volledig geconfigureerd" }),
          { status: 400, headers: corsHeaders }
        );
      }

      await sendViaSMTP(
        partner.smtp_host,
        partner.smtp_port || 587,
        partner.smtp_user,
        partner.smtp_pass_encrypted,
        partner.afzender_email,
        partner.afzender_naam || partner.naam,
        partner.afzender_email,
        "Test e-mail van Mijnhuis.nu",
        `<div style="font-family:sans-serif;padding:20px;">
          <h2>✅ Test geslaagd!</h2>
          <p>Uw SMTP-instellingen zijn correct geconfigureerd. Offertes worden vanaf nu verstuurd vanuit <strong>${partner.afzender_email}</strong>.</p>
          <p style="color:#888;font-size:12px;">— Mijnhuis.nu platform</p>
        </div>`
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send offerte email
    const { offerte_id, ontvanger_email } = body;
    if (!offerte_id || !ontvanger_email) {
      return new Response(
        JSON.stringify({ error: "offerte_id en ontvanger_email zijn verplicht" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: offerte } = await adminClient
      .from("offertes")
      .select("*")
      .eq("id", offerte_id)
      .eq("partner_id", userRow.partner_id)
      .single();

    if (!offerte) {
      return new Response(JSON.stringify({ error: "Offerte niet gevonden" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (!partner.smtp_host || !partner.afzender_email || !partner.smtp_user || !partner.smtp_pass_encrypted) {
      return new Response(
        JSON.stringify({ error: "E-mailconfiguratie is niet ingesteld. Ga naar Instellingen → E-mail configuratie." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="border-bottom:3px solid #5B58E1;padding-bottom:16px;margin-bottom:24px;">
          <h2 style="margin:0;color:#1a1a2e;">${partner.afzender_naam || partner.naam}</h2>
          <p style="margin:4px 0 0;color:#888;font-size:14px;">Offerte ${offerte.offertenummer}</p>
        </div>
        <p>Beste ${offerte.klant_naam},</p>
        <p>Hierbij ontvangt u onze offerte met nummer <strong>${offerte.offertenummer}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:8px;font-weight:bold;">Totaalbedrag (incl. BTW)</td>
            <td style="padding:8px;text-align:right;font-weight:bold;">${formatCurrency(offerte.totaal_bedrag)}</td>
          </tr>
          <tr>
            <td style="padding:8px;">Geldig tot</td>
            <td style="padding:8px;text-align:right;">${new Date(offerte.geldig_tot).toLocaleDateString("nl-NL")}</td>
          </tr>
        </table>
        <p>Neem gerust contact met ons op als u vragen heeft.</p>
        <p>Met vriendelijke groet,<br/><strong>${partner.afzender_naam || partner.naam}</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;" />
        <p style="color:#888;font-size:12px;">Deze e-mail is verstuurd via het Mijnhuis.nu platform.</p>
      </div>
    `;

    await sendViaSMTP(
      partner.smtp_host,
      partner.smtp_port || 587,
      partner.smtp_user,
      partner.smtp_pass_encrypted,
      partner.afzender_email,
      partner.afzender_naam || partner.naam,
      ontvanger_email,
      `Offerte ${offerte.offertenummer} — ${partner.afzender_naam || partner.naam}`,
      html
    );

    // Update status to verzonden if concept
    if (offerte.status === "concept") {
      await adminClient
        .from("offertes")
        .update({ status: "verzonden" })
        .eq("id", offerte_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-offerte-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Interne fout" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
