import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPartnerEmail, PartnerEmailError } from "../_shared/partner-email-send.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType =
  | "nieuw_ticket" | "toewijzing" | "klant_reactie" | "escalatie"
  | "oplossing" | "storing" | "monteur_ticket";

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

    if (body.event === "monteur_ticket") {
      const { data: t } = await supa
        .from("helpdesk_tickets")
        .select("installatie_id")
        .eq("id", body.ticket_id).maybeSingle();
      if (t?.installatie_id) {
        const { data: inst } = await supa
          .from("installaties")
          .select("backoffice_eigenaar_id, created_by")
          .eq("id", t.installatie_id).maybeSingle();
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
      .eq("id", body.ticket_id).maybeSingle();
    if (!ticket) return json({ skipped: "ticket niet gevonden" }, 200);

    const { data: partner } = await supa
      .from("partners").select("naam").eq("id", body.partner_id).maybeSingle();

    const subject = buildSubject(body.event, ticket);
    const html = buildHtml(body.event, ticket, partner?.naam ?? "Helpdesk");

    const results: Array<{ to: string; status: string; error?: string }> = [];
    for (const to of ontvangers) {
      try {
        await sendPartnerEmail({
          adminClient: supa,
          partnerId: body.partner_id,
          to, subject, html,
          type: "helpdesk_notify",
        });
        results.push({ to, status: "verzonden" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const skipped = e instanceof PartnerEmailError && e.status === 400;
        results.push({ to, status: skipped ? "skipped_no_account" : "fout", error: msg });
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
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSubject(event: EventType, t: { ticketnummer: string; titel: string }): string {
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

function buildHtml(
  event: EventType,
  t: { ticketnummer: string; titel: string; prioriteit: string; status: string; type: string; omschrijving: string | null; sla_deadline: string | null },
  partnerNaam: string,
): string {
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
        <tr><td style="padding:8px 0;color:#64748b">Titel</td><td>${esc(t.titel)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Type</td><td>${t.type}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Prioriteit</td><td>${t.prioriteit}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Status</td><td>${t.status}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">SLA-deadline</td><td>${sla}</td></tr>
      </table>
      ${t.omschrijving ? `<p style="margin-top:16px;background:#f1f5f9;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(t.omschrijving)}</p>` : ""}
      <p style="margin-top:24px;font-size:12px;color:#64748b">— ${esc(partnerNaam)} helpdesk</p>
    </div>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
