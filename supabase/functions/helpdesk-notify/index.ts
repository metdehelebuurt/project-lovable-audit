import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendTransactional } from "../_shared/partner-notify-recipients.ts";

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

    const ticketUrl = `${Deno.env.get("SUPABASE_URL")?.replace(/\.supabase\.co$/, "") ?? ""}`; // niet gebruikt — frontend-URL is brand-domein
    const templateData = {
      event: body.event,
      ticketnummer: ticket.ticketnummer,
      titel: ticket.titel,
      prioriteit: ticket.prioriteit,
      status: ticket.status,
      type: ticket.type,
      omschrijving: ticket.omschrijving ?? undefined,
      slaDeadline: ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString("nl-NL") : undefined,
    };
    const idemBase = `helpdesk-${body.event}-${body.ticket_id}`;

    const results: Array<{ to: string; status: string }> = [];
    for (const to of ontvangers) {
      await sendTransactional("helpdesk-event", to, `${idemBase}-${to}`, templateData);
      results.push({ to, status: "enqueued" });
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
