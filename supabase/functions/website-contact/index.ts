// Publieke edge function: contactbericht vanaf de website (mijnhuis.nu/contact).
// Stuurt een interne melding naar info@mijnhuis.nu. Slaat niets op.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notifyMijnhuis, regelsHtml, escapeHtml } from "../_shared/mijnhuis-notify.ts";

const BodySchema = z.object({
  naam: z.string().trim().min(2).max(120),
  bedrijfsnaam: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().max(255),
  telefoon: z.string().trim().max(40).optional().nullable(),
  onderwerp: z.string().trim().max(120).optional().nullable(),
  bericht: z.string().trim().min(5).max(4000),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ error: "Controleer de ingevulde gegevens", velden: parsed.error.flatten().fieldErrors }, 400);
    }
    const b = parsed.data;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const html = `
      <h2 style="margin:0 0 12px">Nieuw contactbericht via de website</h2>
      ${regelsHtml([
        ["Naam", b.naam],
        ["Bedrijf", b.bedrijfsnaam],
        ["E-mail", b.email],
        ["Telefoon", b.telefoon],
        ["Onderwerp", b.onderwerp],
      ])}
      <p style="margin:12px 0 4px"><strong>Bericht</strong></p>
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(b.bericht)}</p>
    `;

    const result = await notifyMijnhuis({
      adminClient: admin,
      subject: `Contactbericht website — ${b.naam}${b.bedrijfsnaam ? ` (${b.bedrijfsnaam})` : ""}`,
      html,
    });

    return json({ success: true, melding: result });
  } catch (err) {
    console.error("website-contact fout:", err);
    return json({ error: "Er ging iets mis. Probeer het later opnieuw." }, 500);
  }
});
