// Publieke edge function: demo-aanvraag vanaf de website (mijnhuis.nu/demo).
// - Legt de aanvraag vast als sales-lead (affiliate_leads).
// - Zet de afspraak in de agenda van info@mijnhuis.nu.
// - Stuurt een interne melding naar info@mijnhuis.nu.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notifyMijnhuis, regelsHtml, escapeHtml } from "../_shared/mijnhuis-notify.ts";

const BodySchema = z.object({
  bedrijfsnaam: z.string().trim().min(2).max(200),
  contactpersoon: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  telefoon: z.string().trim().max(40).optional().nullable(),
  branche: z.string().trim().max(80).optional().nullable(),
  gewenst_moment: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "ongeldige datum"),
  bericht: z.string().trim().max(2000).optional().nullable(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function nlDatum(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ error: "Controleer de ingevulde gegevens", velden: parsed.error.flatten().fieldErrors }, 400);
    }
    const b = parsed.data;
    const moment = new Date(b.gewenst_moment);
    if (moment.getTime() < Date.now() - 60_000) {
      return json({ error: "Kies een moment in de toekomst" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const notitie = [
      `Demo aangevraagd via website voor ${nlDatum(b.gewenst_moment)}.`,
      b.branche ? `Branche: ${b.branche}` : null,
      b.bericht ? `Bericht: ${b.bericht}` : null,
    ].filter(Boolean).join("\n");

    const { data: lead, error: leadError } = await admin
      .from("affiliate_leads")
      .insert({
        bedrijfsnaam: b.bedrijfsnaam,
        contactpersoon: b.contactpersoon,
        email: b.email,
        telefoon: b.telefoon ?? null,
        branche: b.branche ?? null,
        bron: "sales_admin",
        status: "demo_gepland",
        fase_slug: "benaderd",
        volgende_actie_op: moment.toISOString(),
        notities: notitie,
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Demo-lead aanmaken mislukt:", leadError);
      return json({ error: "Aanvraag kon niet worden opgeslagen" }, 500);
    }

    const melding = await notifyMijnhuis({
      adminClient: admin,
      subject: `Demo-aanvraag: ${b.bedrijfsnaam} — ${nlDatum(b.gewenst_moment)}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#222;max-width:560px">
          <h2 style="margin:0 0 12px">Nieuwe demo-aanvraag</h2>
          <div style="background:#f6f6f9;padding:14px 18px;border-radius:10px">
            ${regelsHtml([
              ["Bedrijf", b.bedrijfsnaam],
              ["Contactpersoon", b.contactpersoon],
              ["E-mail", b.email],
              ["Telefoon", b.telefoon],
              ["Branche", b.branche],
              ["Gewenst moment", nlDatum(b.gewenst_moment)],
              ["Bericht", b.bericht],
            ])}
          </div>
          <p style="color:#555">Deze aanvraag staat als sales-lead in het platform (${escapeHtml(lead.id)}).</p>
        </div>`,
      afspraak: {
        titel: `Demo mijnhuis.nu — ${b.bedrijfsnaam}`,
        omschrijving: `${b.contactpersoon} (${b.email}${b.telefoon ? `, ${b.telefoon}` : ""})\n\n${notitie}`,
        startIso: moment.toISOString(),
        duurMinuten: 30,
        gastEmail: b.email,
      },
    });

    return json({ success: true, lead_id: lead.id, mail: melding.mail, agenda: melding.agenda });
  } catch (err) {
    console.error("website-demo-aanvraag fout:", err);
    return json({ error: "Interne serverfout" }, 500);
  }
});
