import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  ticket_id: string;
  partner_id: string;
  bijlage_id: string;
  bestand_url: string;
  mime_type?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.ticket_id || !body.partner_id || !body.bestand_url) {
      return json({ error: "ticket_id, partner_id en bestand_url zijn verplicht" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const isImage = (body.mime_type ?? "").startsWith("image/");
    const messages: Array<Record<string, unknown>> = [
      {
        role: "system",
        content:
          "Je bent een ervaren technicus die foto's, screenshots en logbestanden analyseert voor een helpdesk. Antwoord in helder Nederlands en geef alleen feiten die je kunt afleiden uit het bestand.",
      },
    ];

    if (isImage) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Analyseer deze afbeelding. Geef terug als JSON: {\"samenvatting\":\"...\",\"bevindingen\":[\"...\"],\"vermoedelijke_oorzaak\":\"...\",\"aanbevelingen\":[\"...\"]}",
          },
          { type: "image_url", image_url: { url: body.bestand_url } },
        ],
      });
    } else {
      let snippet = "";
      try {
        const r = await fetch(body.bestand_url);
        if (r.ok) {
          const txt = await r.text();
          snippet = txt.slice(0, 8000);
        }
      } catch (_e) {
        snippet = "";
      }
      messages.push({
        role: "user",
        content: `Analyseer dit logbestand (eerste 8000 tekens). Mime: ${body.mime_type ?? "onbekend"}.\n\n${snippet}\n\nGeef terug als JSON: {"samenvatting":"...","bevindingen":["..."],"vermoedelijke_oorzaak":"...","aanbevelingen":["..."]}`,
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ error: "Te veel verzoeken, probeer later opnieuw." }, 429);
      if (aiRes.status === 402) return json({ error: "AI-tegoed op." }, 402);
      return json({ error: "AI niet beschikbaar" }, 500);
    }

    const data = await aiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let analyse: Record<string, unknown>;
    try {
      analyse = JSON.parse(raw);
    } catch {
      analyse = { samenvatting: raw };
    }

    await fetch(`${supabaseUrl}/rest/v1/helpdesk_ticket_ai_sessies`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ticket_id: body.ticket_id,
        partner_id: body.partner_id,
        type: "bijlage_analyse",
        input: { bijlage_id: body.bijlage_id, mime_type: body.mime_type ?? null },
        output: analyse,
        model: "google/gemini-2.5-pro",
      }),
    });

    return json({ analyse });
  } catch (e) {
    console.error("helpdesk-ai-analyze-bijlage error:", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}