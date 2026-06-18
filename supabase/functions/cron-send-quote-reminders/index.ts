// Dagelijkse cron: stuur automatische herinneringen voor (bijna) verlopen offertes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerConfig {
  partner_id: string;
  actief: boolean;
  dagen_voor_verloop: number[];
  dagen_na_verloop: number[];
  email_template_id: string | null;
  alleen_werkdagen: boolean;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const renderTemplate = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars[k] ?? "");

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

async function sendForPartner(admin: any, cfg: PartnerConfig, today: Date) {
  const result = { sent: 0, skipped: 0, failed: 0 };

  if (cfg.alleen_werkdagen) {
    const dow = today.getDay();
    if (dow === 0 || dow === 6) return result;
  }

  // Template (optioneel)
  let template: { onderwerp: string; inhoud_html: string } | null = null;
  if (cfg.email_template_id) {
    const { data } = await admin
      .from("email_templates")
      .select("onderwerp, inhoud_html")
      .eq("id", cfg.email_template_id)
      .maybeSingle();
    template = data ?? null;
  }

  const { data: partner } = await admin
    .from("partners")
    .select("naam, afzender_naam, afzender_email")
    .eq("id", cfg.partner_id)
    .maybeSingle();

  const moments: Array<{ fase: "voor_verloop" | "na_verloop"; offset: number; targetDate: string }> = [];
  for (const d of cfg.dagen_voor_verloop || []) {
    const dt = new Date(today); dt.setDate(dt.getDate() + d);
    moments.push({ fase: "voor_verloop", offset: d, targetDate: isoDate(dt) });
  }
  for (const d of cfg.dagen_na_verloop || []) {
    const dt = new Date(today); dt.setDate(dt.getDate() - d);
    moments.push({ fase: "na_verloop", offset: d, targetDate: isoDate(dt) });
  }

  for (const m of moments) {
    const { data: offertes } = await admin
      .from("offertes")
      .select("id, offertenummer, klant_naam, klant_email, totaal_bedrag, geldig_tot, lead_id, share_token, status")
      .eq("partner_id", cfg.partner_id)
      .in("status", ["verzonden"])
      .eq("geldig_tot", m.targetDate);

    for (const o of offertes || []) {
      if (!o.klant_email) { result.skipped++; continue; }

      // Dubbele check via unique constraint, maar eerst opzoeken bespaart een send.
      const { data: bestaand } = await admin
        .from("offerte_auto_herinnering_log")
        .select("id")
        .eq("offerte_id", o.id)
        .eq("fase", m.fase)
        .eq("dag_offset", m.offset)
        .maybeSingle();
      if (bestaand) { result.skipped++; continue; }

      // Verstuur via send-offerte-email met service-role auth? Die functie vereist user-JWT.
      // Daarom hier rechtstreeks via email_log + SMTP fallback: roep send-offerte-email NIET aan.
      // We loggen alleen en gebruiken de bestaande email_log + adminClient SMTP via een helper.
      // Eenvoudig: insert email_log met "auto_herinnering" en stuur via interne send helper.

      const vars: Record<string, string> = {
        klant_naam: o.klant_naam || "",
        offertenummer: o.offertenummer || "",
        totaal: formatCurrency(o.totaal_bedrag || 0),
        geldig_tot: new Date(o.geldig_tot).toLocaleDateString("nl-NL"),
        partner_naam: partner?.afzender_naam || partner?.naam || "",
        link: o.share_token
          ? `https://app.mijnhuis.nu/offerte/${o.share_token}`
          : "",
      };

      const isVoor = m.fase === "voor_verloop";
      const standaardSubject = isVoor
        ? `Herinnering: uw offerte ${vars.offertenummer} verloopt binnenkort`
        : `Uw offerte ${vars.offertenummer} is verlopen`;
      const standaardHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e;">
          <h2 style="margin:0 0 16px;">${standaardSubject}</h2>
          <p>Beste ${vars.klant_naam},</p>
          <p>${isVoor
            ? `Onze offerte <strong>${vars.offertenummer}</strong> is geldig tot <strong>${vars.geldig_tot}</strong>. Wij willen u graag laten weten dat de geldigheidsduur bijna verstrijkt.`
            : `Onze offerte <strong>${vars.offertenummer}</strong> is op <strong>${vars.geldig_tot}</strong> verlopen. We horen graag of u nog interesse heeft.`}</p>
          ${vars.link ? `<p><a href="${vars.link}" style="display:inline-block;background:#5B58E1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Bekijk de offerte</a></p>` : ""}
          <p>Heeft u vragen? Reageer dan op deze e-mail.</p>
          <p>Met vriendelijke groet,<br/><strong>${vars.partner_naam}</strong></p>
        </div>`;

      const subject = template?.onderwerp ? renderTemplate(template.onderwerp, vars) : standaardSubject;
      const html = template?.inhoud_html ? renderTemplate(template.inhoud_html, vars) : standaardHtml;

      try {
        // Probeer via SMTP/OAuth (we hergebruiken een minimale send via partner SMTP).
        await sendMail(admin, cfg.partner_id, o.klant_email, subject, html);

        await admin.from("offerte_auto_herinnering_log").insert({
          offerte_id: o.id,
          partner_id: cfg.partner_id,
          fase: m.fase,
          dag_offset: m.offset,
          ontvanger_email: o.klant_email,
        });

        await admin.from("email_log").insert({
          partner_id: cfg.partner_id,
          offerte_id: o.id,
          ontvanger_email: o.klant_email,
          onderwerp: subject,
          html_body: html,
          status: "verzonden",
          type: "auto_herinnering",
        });

        await admin.rpc("log_entity_change", {
          _entiteit_type: "offerte",
          _entiteit_id: o.id,
          _partner_id: cfg.partner_id,
          _actie: "auto_herinnering_verzonden",
          _veld: null,
          _oude: null,
          _nieuwe: o.klant_email,
          _details: { fase: m.fase, dag_offset: m.offset },
        });

        result.sent++;
      } catch (err) {
        result.failed++;
        await admin.from("offerte_auto_herinnering_log").insert({
          offerte_id: o.id,
          partner_id: cfg.partner_id,
          fase: m.fase,
          dag_offset: m.offset,
          ontvanger_email: o.klant_email,
          fout: (err as Error).message?.slice(0, 500) || "Onbekende fout",
        }).then(() => {}, () => {});
        console.error(`[auto-herinnering] offerte ${o.id} fout:`, err);
      }
    }
  }

  return result;
}

async function sendMail(admin: any, partnerId: string, to: string, subject: string, html: string) {
  const { data: partner } = await admin
    .from("partners")
    .select("smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, afzender_email, afzender_naam, naam")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner?.smtp_host || !partner?.smtp_user || !partner?.smtp_pass_encrypted || !partner?.afzender_email) {
    throw new Error("SMTP-configuratie ontbreekt voor deze organisatie");
  }

  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  const client = new SMTPClient({
    connection: {
      hostname: partner.smtp_host,
      port: partner.smtp_port || 587,
      tls: (partner.smtp_port || 587) === 465,
      auth: { username: partner.smtp_user, password: partner.smtp_pass_encrypted },
    },
  });
  await client.send({
    from: `${partner.afzender_naam || partner.naam} <${partner.afzender_email}>`,
    to,
    subject,
    content: "auto",
    html,
  });
  await client.close();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    const { data: configs, error } = await admin
      .from("offerte_auto_herinnering_config")
      .select("partner_id, actief, dagen_voor_verloop, dagen_na_verloop, email_template_id, alleen_werkdagen")
      .eq("actief", true);

    if (error) throw error;

    const totals = { partners: 0, sent: 0, skipped: 0, failed: 0 };
    for (const cfg of (configs || []) as PartnerConfig[]) {
      totals.partners++;
      try {
        const res = await sendForPartner(admin, cfg, today);
        totals.sent += res.sent;
        totals.skipped += res.skipped;
        totals.failed += res.failed;
      } catch (err) {
        console.error(`[auto-herinnering] partner ${cfg.partner_id} fout:`, err);
        totals.failed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, ...totals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cron-send-quote-reminders error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});