import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  ticket_id: string;
  partner_id: string;
  user_id: string;
  merk: string;
  foutcode: string;
  product_categorie?: string;
  product_type?: string;
  context?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.merk || !body.foutcode || !body.ticket_id) {
      return json({ error: "merk, foutcode en ticket_id zijn verplicht" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");

    const systemPrompt = `Je bent een ervaren technisch specialist verduurzaming (zonnepanelen, warmtepompen, thuisbatterijen, laadpalen, isolatie). Geef antwoord in helder Nederlands. Wees concreet en stapsgewijs. Verwijs naar geen externe links die je niet zeker weet.`;

    const userPrompt = `Foutcode-analyse:
- Merk: ${body.merk}
- Foutcode: ${body.foutcode}
${body.product_categorie ? `- Categorie: ${body.product_categorie}` : ""}
${body.product_type ? `- Type: ${body.product_type}` : ""}
${body.context ? `- Context: ${body.context}` : ""}

Geef terug als JSON met velden:
{
  "betekenis": "korte uitleg wat deze foutcode betekent",
  "waarschijnlijke_oorzaken": ["..."],
  "oplossingsstappen": [{"stap": 1, "actie": "...", "verwacht_resultaat": "..."}],
  "veiligheid": "evt. veiligheidswaarschuwing of leeg",
  "wanneer_monteur": "wanneer is fysiek bezoek nodig"
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
      if (aiRes.status === 429) return json({ error: "Te veel verzoeken, probeer later opnieuw." }, 429);
      if (aiRes.status === 402) return json({ error: "AI-tegoed op." }, 402);
      return json({ error: "AI niet beschikbaar" }, 500);
    }

    const data = await aiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let analyse: unknown;
    try {
      analyse = JSON.parse(raw);
    } catch {
      analyse = { betekenis: raw, waarschijnlijke_oorzaken: [], oplossingsstappen: [] };
    }

    // Sla sessie op
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
        user_id: body.user_id,
        type: "foutcode",
        input: { merk: body.merk, foutcode: body.foutcode, context: body.context ?? null },
        output: analyse,
        model: "google/gemini-2.5-flash",
      }),
    });

    return json({ analyse });
  } catch (e) {
    console.error("helpdesk-ai-foutcode error:", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}