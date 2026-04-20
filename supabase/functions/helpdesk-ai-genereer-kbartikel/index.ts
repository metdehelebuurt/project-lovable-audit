import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  ticket_id: string;
  partner_id: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticket_id, partner_id, user_id } = (await req.json()) as Body;
    if (!ticket_id || !partner_id) return json({ error: "ticket_id en partner_id zijn verplicht" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/helpdesk_tickets?id=eq.${ticket_id}&select=*`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const tickets = await tRes.json();
    const ticket = Array.isArray(tickets) ? tickets[0] : null;
    if (!ticket) return json({ error: "Ticket niet gevonden" }, 404);
    if (!ticket.oplossing) return json({ error: "Ticket heeft geen oplossing" }, 400);

    const bRes = await fetch(
      `${supabaseUrl}/rest/v1/helpdesk_ticket_bijlagen?ticket_id=eq.${ticket_id}&select=bestandsnaam,bestand_url,mime_type`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const bijlagen: Array<Record<string, unknown>> = bRes.ok ? await bRes.json() : [];

    const systemPrompt = `Je schrijft interne kennisbank-artikelen voor een installatiebedrijf. Schrijf in helder Nederlands, gestructureerd, beknopt en herbruikbaar voor toekomstige tickets.`;
    const userPrompt = `Ticket data:
Titel: ${ticket.titel}
Categorie: ${ticket.product_categorie ?? "-"}
Merk: ${ticket.product_merk ?? "-"}
Type: ${ticket.product_type ?? "-"}
Foutcode: ${ticket.foutcode ?? "-"}
Probleem: ${ticket.omschrijving ?? "-"}
Oplossing: ${ticket.oplossing}

Geef terug als JSON:
{
  "titel": "korte herbruikbare titel",
  "samenvatting": "1-2 zinnen",
  "probleem": "probleemomschrijving",
  "oplossing": "stappenplan",
  "tags": ["...", "..."]
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ error: "Te veel verzoeken." }, 429);
      if (aiRes.status === 402) return json({ error: "AI-tegoed op." }, 402);
      return json({ error: "AI niet beschikbaar" }, 500);
    }

    const data = await aiRes.json();
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); } catch { /* noop */ }

    const artikelPayload = {
      partner_id,
      titel: (parsed.titel as string) || ticket.titel,
      samenvatting: (parsed.samenvatting as string) ?? null,
      probleem: (parsed.probleem as string) ?? ticket.omschrijving,
      oplossing: (parsed.oplossing as string) ?? ticket.oplossing,
      product_categorie: ticket.product_categorie,
      product_merk: ticket.product_merk,
      product_type: ticket.product_type,
      foutcode: ticket.foutcode,
      tags: parsed.tags ?? [],
      bron_ticket_id: ticket_id,
      status: "concept",
      ai_gegenereerd: true,
      gemaakt_door: user_id,
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/helpdesk_kennis_artikelen`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(artikelPayload),
    });
    if (!insertRes.ok) {
      const t = await insertRes.text();
      return json({ error: `Artikel opslaan mislukt: ${t}` }, 500);
    }
    const created = await insertRes.json();
    const artikel = Array.isArray(created) ? created[0] : created;

    if (bijlagen.length && artikel?.id) {
      const mediaPayload = bijlagen
        .filter((b) => typeof b.mime_type === "string" && (b.mime_type as string).startsWith("image/") || (b.mime_type as string).startsWith("video/"))
        .map((b) => ({
          artikel_id: artikel.id,
          partner_id,
          bestandsnaam: b.bestandsnaam,
          bestand_url: b.bestand_url,
          mime_type: b.mime_type,
        }));
      if (mediaPayload.length) {
        await fetch(`${supabaseUrl}/rest/v1/helpdesk_kennis_media`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(mediaPayload),
        });
      }
    }

    return json({ artikel });
  } catch (e) {
    console.error("helpdesk-ai-genereer-kbartikel error:", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}