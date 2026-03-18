import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { naam, merk, model, categorie, specs, certificeringen, omschrijving, garantie_jaren } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const productInfo = [
      `Product: ${naam}`,
      merk && `Merk: ${merk}`,
      model && `Model: ${model}`,
      categorie && `Categorie: ${categorie}`,
      omschrijving && `Omschrijving: ${omschrijving}`,
      garantie_jaren && `Garantie: ${garantie_jaren} jaar`,
      certificeringen && `Certificeringen: ${certificeringen}`,
      specs && Object.keys(specs).length > 0 && `Huidige specificaties:\n${Object.entries(specs).map(([k,v]) => `  ${k}: ${v}`).join("\n")}`,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Je bent een expert in duurzame energieproducten (zonnepanelen, thuisbatterijen, warmtepompen, laadpalen, omvormers). 
Je taak is om productspecificaties te verifiëren en aan te vullen.

Gebruik je kennis om:
1. Te controleren of de opgegeven specs kloppen voor dit specifieke product
2. Ontbrekende maar belangrijke specificaties toe te voegen
3. Suggesties te doen voor verbeteringen

Antwoord ALTIJD via de tool call.`
          },
          {
            role: "user",
            content: `Verifieer en vul de volgende productspecificaties aan:\n\n${productInfo}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_specs",
              description: "Return verified product specifications",
              parameters: {
                type: "object",
                properties: {
                  verified: {
                    type: "boolean",
                    description: "Whether the existing specs appear correct"
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of suggestions for improvement or missing data (in Dutch)"
                  },
                  corrected_specs: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Complete set of recommended specs (key-value pairs, Dutch labels, including corrected existing ones and new ones)"
                  },
                  omschrijving_suggestie: {
                    type: "string",
                    description: "Suggested product description if missing or improvable (in Dutch)"
                  }
                },
                required: ["verified", "suggestions", "corrected_specs"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "verify_specs" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Krediet op, voeg tegoed toe." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI verificatie mislukt");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Geen AI respons ontvangen");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-verify-product-specs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
