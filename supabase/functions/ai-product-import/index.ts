import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { merk, categorie } = await req.json();
    if (!merk || !categorie) {
      return new Response(JSON.stringify({ error: "merk en categorie zijn verplicht" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categorieMap: Record<string, string> = {
      zonnepanelen: "zonnepanelen / solar panels",
      thuisbatterij: "thuisbatterijen / home batteries",
      warmtepomp: "warmtepompen / heat pumps",
      laadpaal: "laadpalen / EV chargers",
      omvormer: "omvormers / inverters",
      accessoires: "accessoires",
      installatiemateriaal: "installatiemateriaal",
    };

    const catLabel = categorieMap[categorie] || categorie;

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
            content: `Je bent een productdata-expert voor de verduurzamingsbranche in Nederland. Geef alleen echte, bestaande producten terug. Gebruik realistische marktprijzen in EUR excl. BTW. Geef alle technische specificaties die relevant zijn voor de productcategorie. Antwoord altijd via de import_products tool.`,
          },
          {
            role: "user",
            content: `Geef het volledige productassortiment van het merk "${merk}" in de categorie "${catLabel}". Inclusief alle modelvarianten, technische specificaties, indicatieve prijzen en garantie-informatie.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "import_products",
              description: "Importeer een lijst producten met alle specs",
              parameters: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        naam: { type: "string", description: "Volledige productnaam" },
                        model: { type: "string", description: "Model aanduiding" },
                        merk: { type: "string" },
                        omschrijving: { type: "string", description: "Korte productomschrijving" },
                        prijs_excl_btw: { type: "number", description: "Indicatieve prijs excl. BTW in EUR" },
                        garantie_jaren: { type: "number" },
                        certificeringen: { type: "string", description: "Relevante certificeringen" },
                        specs: {
                          type: "object",
                          description: "Technische specificaties als key-value pairs, bijv. vermogen, gewicht, afmetingen, efficiency etc.",
                          additionalProperties: { type: "string" },
                        },
                      },
                      required: ["naam", "model", "merk", "omschrijving", "prijs_excl_btw"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["products"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "import_products" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Krediet onvoldoende. Voeg credits toe aan je workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service fout" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Geen productdata ontvangen van AI", products: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const products = parsed.products || [];

    // Add categorie to each product
    const enriched = products.map((p: any) => ({
      ...p,
      categorie,
    }));

    return new Response(JSON.stringify({ products: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
