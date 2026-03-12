import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Realistic price ranges per category (EUR excl. BTW, per unit)
const priceRanges: Record<string, { min: number; max: number }> = {
  zonnepanelen: { min: 40, max: 800 },
  thuisbatterij: { min: 1500, max: 30000 },
  warmtepomp: { min: 1500, max: 25000 },
  laadpaal: { min: 300, max: 5000 },
  omvormer: { min: 200, max: 8000 },
  accessoires: { min: 1, max: 3000 },
  installatiemateriaal: { min: 1, max: 5000 },
};

interface AIProduct {
  naam: string;
  model: string;
  merk: string;
  omschrijving: string;
  prijs_excl_btw: number;
  garantie_jaren?: number;
  certificeringen?: string;
  specs?: Record<string, string>;
  categorie?: string;
  warnings?: string[];
}

function validateProduct(p: AIProduct, categorie: string): string[] {
  const warnings: string[] = [];

  if (!p.naam || p.naam.trim().length < 3) warnings.push("Productnaam is te kort of ontbreekt");
  if (!p.model || p.model.trim().length < 1) warnings.push("Model ontbreekt");
  if (!p.merk || p.merk.trim().length < 1) warnings.push("Merk ontbreekt");
  if (!p.prijs_excl_btw || p.prijs_excl_btw <= 0) warnings.push("Prijs ontbreekt of is 0");

  const range = priceRanges[categorie];
  if (range && p.prijs_excl_btw) {
    if (p.prijs_excl_btw < range.min || p.prijs_excl_btw > range.max) {
      warnings.push(`Prijs €${p.prijs_excl_btw} lijkt onrealistisch (verwacht €${range.min}-€${range.max})`);
    }
  }

  const specCount = p.specs ? Object.keys(p.specs).length : 0;
  if (specCount < 2) warnings.push("Onvoldoende technische specificaties (min. 2)");

  return warnings;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { merk, categorie } = await req.json();
    if (!merk || !categorie) {
      return new Response(JSON.stringify({ error: "merk en categorie zijn verplicht" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing products for duplicate checking (use service role to bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: existingProducts } = await adminClient
      .from("producten")
      .select("naam, model, merk")
      .ilike("merk", `%${merk}%`)
      .eq("categorie", categorie);

    const existingNames = (existingProducts || []).map(
      (p: any) => `${p.naam} (${p.model || "geen model"})`
    );

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

    const existingNote = existingNames.length > 0
      ? `\n\nDeze producten bestaan al in de catalogus en mogen NIET opnieuw worden geretourneerd:\n${existingNames.join("\n")}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Je bent een productdata-expert voor de verduurzamingsbranche in Nederland en België. Je taak is om een zo COMPLEET mogelijk overzicht te geven van ALLE beschikbare producten van een merk in een categorie.

BELANGRIJKE REGELS:
1. Geef ALLEEN echte, bestaande producten die daadwerkelijk op de markt verkrijgbaar zijn.
2. Geef MINIMAAL 15 en MAXIMAAL 50 producten. Zoek ALLE modelvarianten, vermogensvarianten, kleuren, en configuraties.
3. Gebruik realistische MARKTPRIJZEN in EUR excl. BTW (dealerprijzen, niet consumentenprijzen).
4. Elke product MOET minimaal 3 technische specificaties hebben in het specs object.
5. Gebruik Nederlandse taal voor omschrijvingen.
6. Vermeld bij elk product de garantieduur in jaren.
7. Als een product in meerdere vermogensvarianten bestaat (bijv. 370W, 400W, 405W, 410W), geef dan ELKE variant als apart product.
8. Geef ook eventuele kleurvarianten (zwart/zilver frame) als aparte producten.

Antwoord ALTIJD via de import_products tool.`,
          },
          {
            role: "user",
            content: `Geef het VOLLEDIGE productassortiment van het merk "${merk}" in de categorie "${catLabel}". 

Ik wil ALLE modelvarianten inclusief:
- Alle vermogensvarianten (bijv. 370W, 380W, 400W, 405W, 410W, 415W, 420W, 430W etc.)
- Alle framekleuren (zwart frame, zilver frame)
- Alle series en productlijnen
- Discontinued maar nog verkrijgbare modellen

Geef voor elk product:
- Volledige productnaam met modelnummer
- Indicatieve dealerprijs excl. BTW
- Minimaal 3 technische specificaties
- Garantie-informatie
- Relevante certificeringen${existingNote}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "import_products",
              description: "Importeer een lijst van 15-50 producten met alle specs",
              parameters: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        naam: { type: "string", description: "Volledige productnaam inclusief modelnummer" },
                        model: { type: "string", description: "Model aanduiding / typenummer" },
                        merk: { type: "string" },
                        omschrijving: { type: "string", description: "Korte productomschrijving in het Nederlands" },
                        prijs_excl_btw: { type: "number", description: "Indicatieve dealerprijs excl. BTW in EUR" },
                        garantie_jaren: { type: "number", description: "Productgarantie in jaren" },
                        certificeringen: { type: "string", description: "Relevante certificeringen (bijv. IEC, MCS, TÜV)" },
                        specs: {
                          type: "object",
                          description: "Technische specificaties als key-value pairs. Minimaal 3 specs per product. Bijv: vermogen, gewicht, afmetingen, efficiency, spanning, stroom, celtype etc.",
                          additionalProperties: { type: "string" },
                        },
                      },
                      required: ["naam", "model", "merk", "omschrijving", "prijs_excl_btw", "specs"],
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
      return new Response(JSON.stringify({ error: "Geen productdata ontvangen van AI", products: [], bestaande_producten: existingNames }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const products: AIProduct[] = parsed.products || [];

    // Validate and enrich each product
    const enriched = products.map((p: AIProduct) => {
      const warnings = validateProduct(p, categorie);
      return {
        ...p,
        categorie,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    });

    return new Response(JSON.stringify({
      products: enriched,
      bestaande_producten: existingNames,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
