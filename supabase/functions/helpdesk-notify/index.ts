import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType = "nieuw_ticket" | "toewijzing" | "klant_reactie" | "escalatie" | "oplossing" | "storing" | "monteur_ticket";

type Payload = {
  event: EventType;
  ticket_id: string;
  partner_id: string;
  extra?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body.event || !body.ticket_id || !body.partner_id) {
      return json({ error: "event, ticket_id en partner_id zijn verplicht" }, 400);
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cfg } = await supa
      .from("helpdesk_notificatie_config")
      .select("*")
      .eq("partner_id", body.partner_id)
      .maybeSingle();

    if (!cfg) return json({ skipped: "geen config" }, 200);

    const fieldMap: Record<EventType, keyof typeof cfg> = {
      nieuw_ticket: "email_bij_nieuw_ticket",
      toewijzing: "email_bij_toewijzing",
      klant_reactie: "email_bij_klant_reactie",
      escalatie: "email_bij_escalatie",
      oplossing: "email_bij_oplossing",
      storing: "email_bij_storing",
      monteur_ticket: "email_bij_nieuw_ticket",
    };
    if (!cfg[fieldMap[body.event]]) return json({ skipped: "uitgeschakeld" }, 200);

    let ontvangers = Array.isArray(cfg.ontvangers) ? (cfg.ontvangers as string[]) : [];

    // Bij monteur_ticket: stuur naar backoffice-eigenaar van gekoppelde installatie
    if (body.event === "monteur_ticket") {
      const { data: t } = await supa
        .from("helpdesk_tickets")
        .select("installatie_id")
        .eq("id", body.ticket_id)
        .maybeSingle();
      if (t?.installatie_id) {
        const { data: inst } = await supa
          .from("installaties")
          .select("backoffice_eigenaar_id, created_by")
          .eq("id", t.installatie_id)
          .maybeSingle();
        const eigenaarId = inst?.backoffice_eigenaar_id ?? inst?.created_by;
        if (eigenaarId) {
          const { data: u } = await supa.from("users").select("email").eq("id", eigenaarId).maybeSingle();
          if (u?.email) ontvangers = [u.email, ...ontvangers];
        }
      }
    }

    if (ontvangers.length === 0) return json({ skipped: "geen ontvangers" }, 200);

    const { data: ticket } = await supa
      .from("helpdesk_tickets")
      .select("ticketnummer, titel, prioriteit, status, type, omschrijving, sla_deadline")
      .eq("id", body.ticket_id)
      .maybeSingle();
    if (!ticket) return json({ skipped: "ticket niet gevonden" }, 200);

    const { data: partner } = await supa
      .from("partners")
      .select("naam")
      .eq("id", body.partner_id)
      .maybeSingle();

    const subject = buildSubject(body.event, ticket);
    const html = buildHtml(body.event, ticket, partner?.naam ?? "Helpdesk");

    // Verzenden via partner-email-account (Gmail/MS Graph) — zelfde patroon als email-api-send
    const { data: emailAccount } = await supa
      .from("email_accounts")
      .select("*")
      .eq("partner_id", body.partner_id)
      .eq("actief", true)
      .maybeSingle();

    const results: Array<{ to: string; status: string; error?: string }> = [];

    for (const to of ontvangers) {
      try {
        if (emailAccount) {
          let token = emailAccount.access_token;
          if (new Date(emailAccount.token_expiry) <= new Date()) {
            token = await refreshToken(supa, emailAccount);
          }
          if (emailAccount.provider === "google") {
            await sendGmail(token, emailAccount.email_adres, to, subject, html);
          } else {
            await sendGraph(token, to, subject, html);
          }
        }
        await supa.from("email_log").insert({
          partner_id: body.partner_id,
          ontvanger_email: to,
          onderwerp: subject,
          html_body: html,
          status: emailAccount ? "verzonden" : "skipped_no_account",
          type: "helpdesk_notify",
        });
        results.push({ to, status: emailAccount ? "verzonden" : "skipped" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supa.from("email_log").insert({
          partner_id: body.partner_id,
          ontvanger_email: to,
          onderwerp: subject,
          html_body: html,
          status: "fout",
          type: "helpdesk_notify",
          error_message: msg,
        });
        results.push({ to, status: "fout", error: msg });
      }
    }

    return json({ ok: true, event: body.event, results }, 200);
  } catch (e) {
    console.error("helpdesk-notify error", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSubject(event: EventType, t: { ticketnummer: string; titel: string; prioriteit: string }): string {
  const emoji = event === "storing" || event === "escalatie" ? "🚨 " : "";
  const labels: Record<EventType, string> = {
    nieuw_ticket: "Nieuw ticket",
    toewijzing: "Ticket toegewezen",
    klant_reactie: "Klantreactie op ticket",
    escalatie: "Ticket geëscaleerd",
    oplossing: "Ticket opgelost",
    storing: "STORING gemeld",
    monteur_ticket: "Monteur heeft een ticket aangemaakt",
  };
  return `${emoji}${labels[event]}: ${t.ticketnummer} — ${t.titel}`;
}

function buildHtml(event: EventType, t: { ticketnummer: string; titel: string; prioriteit: string; status: string; type: string; omschrijving: string | null; sla_deadline: string | null }, partnerNaam: string): string {
  const labels: Record<EventType, string> = {
    nieuw_ticket: "Er is een nieuw ticket aangemaakt.",
    toewijzing: "Een ticket is aan je toegewezen.",
    klant_reactie: "Er is een klantreactie geplaatst op een ticket.",
    escalatie: "Een ticket is geëscaleerd door SLA-overschrijding.",
    oplossing: "Een ticket is gemarkeerd als opgelost.",
    storing: "Er is een storing gemeld die direct aandacht vraagt.",
    monteur_ticket: "Een monteur heeft een ticket aangemaakt op een installatie die jij beheert.",
  };
  const sla = t.sla_deadline ? new Date(t.sla_deadline).toLocaleString("nl-NL") : "—";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
      <h2 style="margin:0 0 16px">${labels[event]}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#64748b;width:140px">Ticketnummer</td><td><strong>${t.ticketnummer}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Titel</td><td>${escapeHtml(t.titel)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Type</td><td>${t.type}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Prioriteit</td><td>${t.prioriteit}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Status</td><td>${t.status}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">SLA-deadline</td><td>${sla}</td></tr>
      </table>
      ${t.omschrijving ? `<p style="margin-top:16px;background:#f1f5f9;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(t.omschrijving)}</p>` : ""}
      <p style="margin-top:24px;font-size:12px;color:#64748b">— ${escapeHtml(partnerNaam)} helpdesk</p>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function refreshToken(admin: ReturnType<typeof createClient>, account: { provider: string; refresh_token: string; id: string }): Promise<string> {
  const isGoogle = account.provider === "google";
  const url = isGoogle ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const params = isGoogle
    ? { client_id: Deno.env.get("GOOGLE_EMAIL_CLIENT_ID")!, client_secret: Deno.env.get("GOOGLE_EMAIL_CLIENT_SECRET")!, refresh_token: account.refresh_token, grant_type: "refresh_token" }
    : { client_id: Deno.env.get("MICROSOFT_EMAIL_CLIENT_ID")!, client_secret: Deno.env.get("MICROSOFT_EMAIL_CLIENT_SECRET")!, refresh_token: account.refresh_token, grant_type: "refresh_token", scope: "https://graph.microsoft.com/Mail.Send offline_access" };
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
  const data = await r.json();
  if (data.error) throw new Error(`Token refresh: ${data.error_description || data.error}`);
  await admin.from("email_accounts").update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
  }).eq("id", account.id);
  return data.access_token;
}

async function sendGmail(token: string, from: string, to: string, subject: string, html: string) {
  const raw = [
    `From: ${from}`, `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`, `Content-Type: text/html; charset=UTF-8`, ``, html,
  ].join("\r\n");
  const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!r.ok) throw new Error(`Gmail: ${await r.text()}`);
}

async function sendGraph(token: string, to: string, subject: string, html: string) {
  const r = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { subject, body: { contentType: "HTML", content: html }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }),
  });
  if (!r.ok) throw new Error(`Graph: ${await r.text()}`);
}
