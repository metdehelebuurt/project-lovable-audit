import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id is vereist");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch lead + related data
    const [leadRes, offertesRes, schouwendRes] = await Promise.all([
      sb.from("leads").select("*").eq("id", lead_id).single(),
      sb.from("offertes").select("id, offertenummer, status, totaal_bedrag, created_at, regels").eq("lead_id", lead_id),
      sb.from("schouwen").select("id, schouw_nummer, categorie, status, gegevens, aandachtspunten").eq("lead_id", lead_id),
    ]);

    if (leadRes.error) throw new Error("Lead niet gevonden");
    const lead = leadRes.data;
    const offertes = offertesRes.data || [];
    const schouwen = schouwendRes.data || [];

    const prompt = `Analyseer de volgende lead voor een duurzame energie installatiebedrijf en geef 3-5 concrete koopsignalen en commerciële adviezen.

LEAD GEGEVENS:
- Naam: ${lead.voornaam} ${lead.achternaam}
- Status: ${lead.lead_status}
- Bron: ${lead.bron || "onbekend"}
- Locatie: ${lead.plaats || "onbekend"}
- Bedrijf: ${lead.bedrijfsnaam || "particulier"}
- Notities: ${lead.notities || "geen"}
- Aangemaakt: ${lead.created_at}

OFFERTES (${offertes.length}):
${offertes.map(o => `- ${o.offertenummer}: status=${o.status}, bedrag=€${o.totaal_bedrag}`).join("\n") || "Geen offertes"}

SCHOUWEN (${schouwen.length}):
${schouwen.map(s => `- ${s.schouw_nummer}: categorie=${s.categorie}, status=${s.status}${s.aandachtspunten ? `, aandachtspunten: ${s.aandachtspunten}` : ""}`).join("\n") || "Geen schouwen"}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Je bent een commercieel adviseur voor duurzame energie bedrijven in Nederland. Analyseer leads en geef concrete koopsignalen en adviezen om de conversie te verhogen. Antwoord altijd in het Nederlands.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_signals",
              description: "Return buying signals and advice for this lead",
              parameters: {
                type: "object",
                properties: {
                  signals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titel: { type: "string", description: "Korte titel van het signaal" },
                        beschrijving: { type: "string", description: "Uitleg en concreet advies (2-3 zinnen)" },
                        prioriteit: { type: "string", enum: ["hoog", "middel", "laag"] },
                      },
                      required: ["titel", "beschrijving", "prioriteit"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["signals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_signals" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt. Probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits op. Voeg credits toe in je workspace instellingen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway fout: " + status);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Geen AI response ontvangen");

    const signals = JSON.parse(toolCall.function.arguments).signals;

    return new Response(JSON.stringify({ signals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-lead-signals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
