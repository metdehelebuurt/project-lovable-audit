import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCHEMAS: Record<string, { description: string; properties: Record<string, any>; required: string[] }> = {
  producten: {
    description: "Array of products mapped from the input data",
    properties: {
      naam: { type: "string", description: "Product name" },
      categorie: { type: "string", enum: ["zonnepanelen","thuisbatterij","warmtepomp","laadpaal","omvormer","accessoires","installatiemateriaal"] },
      merk: { type: "string", description: "Brand name" },
      model: { type: "string", description: "Model name/number" },
      omschrijving: { type: "string", description: "Product description" },
      prijs_excl_btw: { type: "number", description: "Price excl VAT in EUR" },
      kostprijs: { type: "number", description: "Cost price in EUR" },
      eenheid: { type: "string", description: "Unit (stuk, meter, m2, etc)" },
      voorraad: { type: "number", description: "Stock quantity" },
      btw_percentage: { type: "number", description: "VAT percentage (default 21)" },
      product_code: { type: "string", description: "Product code/SKU" },
      leverancier: { type: "string", description: "Supplier name" },
      artikelnummer: { type: "string", description: "Article number" },
      ean_code: { type: "string", description: "EAN/barcode" },
      levertijd: { type: "string", description: "Delivery time" },
      garantie_jaren: { type: "number", description: "Warranty years" },
      certificeringen: { type: "string", description: "Certifications" },
    },
    required: ["naam", "categorie", "prijs_excl_btw"],
  },
  leads: {
    description: "Array of leads mapped from the input data",
    properties: {
      voornaam: { type: "string", description: "First name" },
      achternaam: { type: "string", description: "Last name" },
      email: { type: "string", description: "Email address" },
      telefoon: { type: "string", description: "Phone number" },
      bedrijfsnaam: { type: "string", description: "Company name" },
      adres: { type: "string", description: "Street address" },
      postcode: { type: "string", description: "Postal code" },
      plaats: { type: "string", description: "City" },
      bron: { type: "string", description: "Source (website, telefoon, referral, advertentie, beurs, overig)" },
      notities: { type: "string", description: "Notes" },
    },
    required: ["voornaam", "achternaam", "email"],
  },
  offertes: {
    description: "Array of quotes mapped from the input data",
    properties: {
      klant_naam: { type: "string", description: "Customer full name" },
      klant_email: { type: "string", description: "Customer email" },
      klant_telefoon: { type: "string", description: "Customer phone" },
      klant_adres: { type: "string", description: "Customer address" },
      klant_postcode: { type: "string", description: "Customer postal code" },
      klant_plaats: { type: "string", description: "Customer city" },
      notities: { type: "string", description: "Notes" },
      subtotaal: { type: "number", description: "Subtotal excl VAT" },
      btw_bedrag: { type: "number", description: "VAT amount" },
      totaal_bedrag: { type: "number", description: "Total incl VAT" },
    },
    required: ["klant_naam", "klant_email"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Get user profile with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: userProfile } = await adminClient.from("users").select("partner_id, rol").eq("id", userId).single();
    if (!userProfile?.partner_id && userProfile?.rol !== "superadmin") {
      return new Response(JSON.stringify({ error: "Geen partner gekoppeld" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const partnerId = userProfile.partner_id;
    const { entity_type, raw_data, action, records, file_name } = await req.json();

    if (!entity_type || !SCHEMAS[entity_type]) {
      return new Response(JSON.stringify({ error: "Ongeldig entity_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // PREVIEW: Use AI to map raw data to schema
    if (action === "preview") {
      if (!raw_data) {
        return new Response(JSON.stringify({ error: "Geen data ontvangen" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const schema = SCHEMAS[entity_type];
      const systemPrompt = `You are a data mapping assistant. The user provides raw data (CSV, JSON, TSV, Excel text, or free-form text) that needs to be mapped to a specific schema.

Rules:
- Map columns/fields intelligently regardless of language or naming convention
- If a field cannot be mapped, leave it as null/empty
- For prices: parse numbers, remove currency symbols, convert commas to dots for decimals
- For categories (producten): map to the closest matching enum value
- For bron (leads): map to closest value from: website, telefoon, referral, advertentie, beurs, overig
- Return ALL rows from the input data
- Add a "warnings" array per record for any issues (missing required fields, unparseable values)
- File name for context: ${file_name || "unknown"}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Map the following data to the ${entity_type} schema:\n\n${raw_data}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "map_data",
                description: `Map imported data to ${entity_type} records`,
                parameters: {
                  type: "object",
                  properties: {
                    records: {
                      type: "array",
                      description: schema.description,
                      items: {
                        type: "object",
                        properties: {
                          ...schema.properties,
                          warnings: { type: "array", items: { type: "string" }, description: "Any warnings about this record" },
                        },
                        required: schema.required,
                      },
                    },
                  },
                  required: ["records"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "map_data" } },
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "AI limiet bereikt, probeer het later opnieuw" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits op, voeg credits toe" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const errText = await aiResponse.text();
        console.error("AI error:", aiResponse.status, errText);
        return new Response(JSON.stringify({ error: "AI verwerkingsfout" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiResult = await aiResponse.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "AI kon de data niet verwerken" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const mappedData = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ records: mappedData.records }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CONFIRM: Insert records
    if (action === "confirm") {
      if (!records || !Array.isArray(records) || records.length === 0) {
        return new Response(JSON.stringify({ error: "Geen records ontvangen" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let insertCount = 0;

      if (entity_type === "producten") {
        const rows = records.map((r: any) => ({
          naam: r.naam,
          categorie: r.categorie || "accessoires",
          merk: r.merk || null,
          model: r.model || null,
          omschrijving: r.omschrijving || null,
          prijs_excl_btw: r.prijs_excl_btw || 0,
          kostprijs: r.kostprijs || null,
          eenheid: r.eenheid || "stuk",
          voorraad: r.voorraad || null,
          btw_percentage: r.btw_percentage || 21,
          product_code: r.product_code || null,
          leverancier: r.leverancier || null,
          artikelnummer: r.artikelnummer || null,
          ean_code: r.ean_code || null,
          levertijd: r.levertijd || null,
          garantie_jaren: r.garantie_jaren || null,
          certificeringen: r.certificeringen || null,
          partner_id: partnerId,
          status: "actief",
        }));
        const { error } = await adminClient.from("producten").insert(rows);
        if (error) throw error;
        insertCount = rows.length;
      } else if (entity_type === "leads") {
        const rows = records.map((r: any) => ({
          voornaam: r.voornaam,
          achternaam: r.achternaam,
          email: r.email,
          telefoon: r.telefoon || null,
          bedrijfsnaam: r.bedrijfsnaam || null,
          adres: r.adres || null,
          postcode: r.postcode || null,
          plaats: r.plaats || null,
          bron: r.bron || null,
          notities: r.notities || null,
          partner_id: partnerId,
          owner_user_id: userId,
          lead_status: "nieuw",
        }));
        const { error } = await adminClient.from("leads").insert(rows);
        if (error) throw error;
        insertCount = rows.length;
      } else if (entity_type === "offertes") {
        const rows = records.map((r: any) => {
          const subtotaal = r.subtotaal || 0;
          const btwBedrag = r.btw_bedrag || 0;
          const totaal = r.totaal_bedrag || subtotaal + btwBedrag;
          const d = new Date();
          const yy = d.getFullYear().toString().slice(2);
          const mm = (d.getMonth() + 1).toString().padStart(2, "0");
          const dd = d.getDate().toString().padStart(2, "0");
          const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
          return {
            klant_naam: r.klant_naam,
            klant_email: r.klant_email,
            klant_telefoon: r.klant_telefoon || null,
            klant_adres: r.klant_adres || null,
            klant_postcode: r.klant_postcode || null,
            klant_plaats: r.klant_plaats || null,
            notities: r.notities || null,
            subtotaal,
            btw_bedrag: btwBedrag,
            totaal_bedrag: totaal,
            offertenummer: `OF-${yy}${mm}${dd}-${rand}`,
            partner_id: partnerId,
            adviseur_id: userId,
            status: "concept",
            regels: [],
          };
        });
        const { error } = await adminClient.from("offertes").insert(rows);
        if (error) throw error;
        insertCount = rows.length;
      }

      return new Response(JSON.stringify({ success: true, count: insertCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ongeldige actie" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("ai-data-import error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
