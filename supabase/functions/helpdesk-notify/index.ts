import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = {
  event: "nieuw_ticket" | "toewijzing" | "klant_reactie" | "escalatie" | "oplossing" | "storing";
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

    const fieldMap: Record<Payload["event"], keyof typeof cfg> = {
      nieuw_ticket: "email_bij_nieuw_ticket",
      toewijzing: "email_bij_toewijzing",
      klant_reactie: "email_bij_klant_reactie",
      escalatie: "email_bij_escalatie",
      oplossing: "email_bij_oplossing",
      storing: "email_bij_storing",
    };
    const field = fieldMap[body.event];
    if (!cfg[field]) return json({ skipped: "uitgeschakeld" }, 200);

    const ontvangers = Array.isArray(cfg.ontvangers) ? (cfg.ontvangers as string[]) : [];
    if (ontvangers.length === 0) return json({ skipped: "geen ontvangers" }, 200);

    const { data: ticket } = await supa
      .from("helpdesk_tickets")
      .select("ticketnummer, titel, prioriteit, status, type")
      .eq("id", body.ticket_id)
      .maybeSingle();

    // Email-verzending wordt in fase 2 gekoppeld aan SendGrid (consistent met bestaande email_log).
    // Voor nu: log de notificatie zodat we event-flow kunnen valideren.
    console.log("helpdesk-notify", { event: body.event, ontvangers, ticket });

    return json({ ok: true, ontvangers, ticket }, 200);
  } catch (e) {
    console.error("helpdesk-notify error", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}