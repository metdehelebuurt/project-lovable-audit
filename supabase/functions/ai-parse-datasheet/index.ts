import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Machine-key definitions per category
const categoryMachineKeys: Record<string, Record<string, string[]>> = {
  zonnepanelen: {
    "Elektrisch": ["vermogen_wp", "efficiency_pct", "celtype", "aantal_cellen", "voc_v", "isc_a", "vmpp_v", "impp_a", "max_systeemspanning_v", "max_zekering_a", "bifacial", "bifacial_factor_pct"],
    "Thermisch": ["temp_coeff_pmax", "temp_coeff_voc", "temp_coeff_isc", "noct_c"],
    "Fysiek": ["lengte_mm", "breedte_mm", "hoogte_mm", "gewicht_kg", "ip_rating", "connectortype", "kabellengte_mm", "kleur_frame", "kleur_backsheet", "glastype", "glasdikte_mm", "kleur", "bedrijfstemperatuur_bereik"],
    "Mechanisch": ["windbelasting_pa", "sneeuwbelasting_pa", "brandklasse"],
    "Prestatie": ["degradatie_jaar1_pct", "degradatie_jaarlijks_pct"],
    "Garantie & Certificering": ["productgarantie_jaar", "vermogensgarantie_jaar", "vermogensgarantie_pct", "certificeringen"],
    "Algemeen": ["land_van_herkomst"],
  },
  thuisbatterij: {
    "Capaciteit": ["bruikbare_capaciteit_kwh", "nominale_capaciteit_kwh", "dod_pct"],
    "Vermogen": ["nominaal_vermogen_kw", "piekvermogen_kw", "max_laadstroom_a", "max_ontlaadstroom_a"],
    "Elektrisch": ["celtype", "roundtrip_efficiency_pct", "nominale_spanning_v", "spanningsbereik_v", "fase"],
    "Levensduur": ["cycli", "verwachte_levensduur_jaar"],
    "Fysiek": ["lengte_mm", "breedte_mm", "hoogte_mm", "gewicht_kg", "ip_rating", "montagetype", "bedrijfstemperatuur_bereik", "opslagtemperatuur_bereik", "kleur"],
    "Connectiviteit": ["wifi", "ethernet", "rs485", "can_bus", "bluetooth", "app_aanwezig", "monitoring_platform"],
    "Functionaliteit": ["noodstroom", "uitbreidbaar", "max_modules_cascade", "compatibele_omvormers"],
    "Veiligheid": ["brandklasse"],
    "Garantie & Certificering": ["productgarantie_jaar", "certificeringen"],
    "Algemeen": ["land_van_herkomst"],
  },
  warmtepomp: {
    "Type": ["type_warmtepomp", "split_monoblock"],
    "Prestatie": ["verwarmingscapaciteit_a7w35_kw", "verwarmingscapaciteit_a2w35_kw", "verwarmingscapaciteit_a_7w35_kw", "cop_a7w35", "cop_a2w35", "scop"],
    "Koeling": ["koelvermogen_kw", "eer", "seer"],
    "Geluid": ["geluid_buitenunit_dba", "geluid_binnenunit_dba"],
    "Koudemiddel": ["koudemiddel_type", "gwp", "koudemiddel_hoeveelheid_kg"],
    "Elektrisch": ["elektrisch_vermogen_max_kw", "aansluitspanning_v", "zekering_a", "fase"],
    "Water": ["max_watertemperatuur_c", "debiet_l_min", "wateraansluiting"],
    "Fysiek buitenunit": ["buitenunit_breedte_mm", "buitenunit_hoogte_mm", "buitenunit_diepte_mm", "buitenunit_gewicht_kg"],
    "Fysiek binnenunit": ["binnenunit_breedte_mm", "binnenunit_hoogte_mm", "binnenunit_diepte_mm", "binnenunit_gewicht_kg"],
    "Energie": ["energielabel_verwarming", "energielabel_warm_water"],
    "Subsidie & Regelgeving": ["subsidiabel", "smart_grid_ready"],
    "Fysiek": ["gewicht_kg", "ip_rating", "kleur", "bedrijfstemperatuur_bereik"],
    "Garantie & Certificering": ["productgarantie_jaar", "certificeringen"],
    "Algemeen": ["land_van_herkomst"],
  },
  laadpaal: {
    "Laden": ["laadvermogen_kw", "max_laadstroom_a", "fase", "aansluitspanning_v", "connector_type", "vaste_kabel", "kabellengte_m"],
    "Smart functies": ["smart_charging", "load_balancing", "dynamic_load_balancing", "solar_charging", "vehicle_to_grid", "thuisbatterij_compatibel"],
    "Connectiviteit": ["wifi", "4g_lte", "ethernet", "bluetooth", "ocpp_versie", "app_aanwezig", "monitoring_platform"],
    "Authenticatie": ["rfid", "plug_and_charge", "pin_code"],
    "Meting": ["energiemeter_ingebouwd", "mid_gecertificeerd"],
    "Fysiek": ["lengte_mm", "breedte_mm", "hoogte_mm", "gewicht_kg", "ip_rating", "ik_rating", "installatiewijze", "bedrijfstemperatuur_bereik", "kleur"],
    "Garantie & Certificering": ["productgarantie_jaar", "certificeringen"],
    "Algemeen": ["land_van_herkomst"],
  },
  omvormer: {
    "Type": ["type_omvormer", "hybride"],
    "DC-zijde": ["max_dc_vermogen_wp", "max_dc_spanning_v", "mppt_bereik_v", "aantal_mppt_trackers", "strings_per_mppt", "max_ingangsstroom_per_mppt_a", "max_kortsluitstroom_a"],
    "AC-zijde": ["nominaal_ac_vermogen_w", "max_ac_vermogen_va", "fase", "nominale_ac_spanning_v", "frequentie_hz", "thd_pct", "power_factor"],
    "Rendement": ["europees_rendement_pct", "max_rendement_pct", "nachtverbruik_w"],
    "Fysiek": ["lengte_mm", "breedte_mm", "hoogte_mm", "gewicht_kg", "ip_rating", "koeling", "bedrijfstemperatuur_bereik", "max_hoogte_m", "kleur"],
    "Communicatie": ["wifi", "ethernet", "rs485", "monitoring_platform", "app_aanwezig"],
    "Batterij": ["batterij_compatibel", "compatibele_batterijen", "max_batterij_stroom_a"],
    "Garantie & Certificering": ["productgarantie_jaar", "certificeringen"],
    "Algemeen": ["land_van_herkomst"],
  },
};

function getAllowedKeys(categorie: string): Set<string> {
  const groups = categoryMachineKeys[categorie];
  if (!groups) return new Set();
  const keys = new Set<string>();
  for (const arr of Object.values(groups)) {
    for (const k of arr) keys.add(k);
  }
  return keys;
}

const keyLabelMap: Record<string, string> = {
  vermogen_wp: "Vermogen (Wp)", efficiency_pct: "Efficiency (%)", celtype: "Celtype",
  bruikbare_capaciteit_kwh: "Bruikbare capaciteit (kWh)", nominale_capaciteit_kwh: "Nominale capaciteit (kWh)",
  dod_pct: "Depth of Discharge (%)", nominaal_vermogen_kw: "Nominaal vermogen (kW)",
  piekvermogen_kw: "Piekvermogen (kW)", roundtrip_efficiency_pct: "Roundtrip efficiëntie (%)",
  lengte_mm: "Lengte (mm)", breedte_mm: "Breedte (mm)", hoogte_mm: "Hoogte (mm)",
  gewicht_kg: "Gewicht (kg)", ip_rating: "IP-rating", productgarantie_jaar: "Productgarantie (jaar)",
  certificeringen: "Certificeringen", cycli: "Aantal cycli",
};

function buildSpecPrompt(categorie: string): string {
  const specs = categoryMachineKeys[categorie];
  if (!specs) return "Gebruik je expertise om alle relevante specificaties te bepalen. Gebruik snake_case keys.";
  const lines = [`Specificatielijst voor ${categorie} — gebruik EXACT deze machine-keys:`];
  for (const [group, keys] of Object.entries(specs)) {
    const items = keys.map(k => `${k} (= ${keyLabelMap[k] || k})`).join(", ");
    lines.push(`  ${group}: ${items}`);
  }
  return lines.join("\n");
}

function normalizeValue(key: string, val: string): string {
  if (!val || typeof val !== "string") return val;
  let v = val.trim();
  // Remove common units
  v = v.replace(/\s*(Wp|kWh|Wh|kW|W|kg|mm|cm|m|V|A|Hz|Pa|dB\(A\)|dBA|°C|%|jaar|cycles?)\s*$/i, "").trim();
  // Decimal comma to dot
  v = v.replace(/(\d),(\d)/g, "$1.$2");
  // Boolean normalization
  const lower = v.toLowerCase();
  if (["yes", "ja", "true", "✓", "✔", "√"].includes(lower)) return "Ja";
  if (["no", "nee", "false", "✗", "✘", "×", "-"].includes(lower)) return "Nee";
  return v;
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { product_id, categorie } = await req.json();
    if (!product_id || !categorie) {
      return new Response(JSON.stringify({ error: "product_id en categorie zijn verplicht" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the product's datasheet_url from DB
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: productRow, error: productErr } = await adminClient
      .from("producten")
      .select("datasheet_url, datasheet_type, naam, merk, model")
      .eq("id", product_id)
      .single();

    if (productErr || !productRow?.datasheet_url) {
      return new Response(JSON.stringify({ error: "Geen datasheet gevonden voor dit product. Upload eerst een PDF." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build public URL for the PDF
    const pdfPublicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${productRow.datasheet_url}`;
    console.log("PDF public URL:", pdfPublicUrl);

    // Step 1: Use Firecrawl to extract text/markdown from the PDF
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl connector niet geconfigureerd" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scraping PDF via Firecrawl...");
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pdfPublicUrl,
        formats: ["markdown"],
        onlyMainContent: false,
      }),
    });

    let pdfText = "";
    if (scrapeResponse.ok) {
      const scrapeData = await scrapeResponse.json();
      pdfText = scrapeData?.data?.markdown || scrapeData?.markdown || "";
      console.log(`Firecrawl extracted ${pdfText.length} chars`);
    } else {
      console.warn("Firecrawl scrape failed, status:", scrapeResponse.status);
    }

    // Fallback: if Firecrawl failed or returned empty, try direct PDF download + base64 to AI
    if (!pdfText || pdfText.length < 50) {
      console.log("Firecrawl returned insufficient text, falling back to direct PDF binary...");
      const { data: fileData, error: downloadError } = await adminClient.storage
        .from("product-images")
        .download(productRow.datasheet_url);

      if (downloadError || !fileData) {
        return new Response(JSON.stringify({ 
          error: "PDF kon niet worden gelezen. Probeer het bestand opnieuw te uploaden.",
          filled_count: 0,
        }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use binary PDF as fallback via base64
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      pdfText = `[PDF_BASE64]:${btoa(binary)}`;
    }

    // Step 2: Send extracted text to AI for spec mapping
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categoryGuide = buildSpecPrompt(categorie);
    const isBase64 = pdfText.startsWith("[PDF_BASE64]:");

    const userContent = isBase64
      ? [
          {
            type: "text",
            text: `Extraheer alle technische specificaties uit deze product-datasheet PDF voor de categorie "${categorie}". Product: ${productRow.naam || "onbekend"}, Merk: ${productRow.merk || "onbekend"}, Model: ${productRow.model || "onbekend"}. Map alle waarden naar de exacte machine-keys.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:application/pdf;base64,${pdfText.slice(13)}` },
          },
        ]
      : `Hieronder staat de inhoud van een product-datasheet (geëxtraheerd uit PDF) voor de categorie "${categorie}".
Product: ${productRow.naam || "onbekend"}, Merk: ${productRow.merk || "onbekend"}, Model: ${productRow.model || "onbekend"}.

Extraheer ALLE technische specificaties en map ze naar de exacte machine-keys.

--- BEGIN DATASHEET INHOUD ---
${pdfText}
--- EINDE DATASHEET INHOUD ---`;

    console.log("Sending to AI for spec extraction...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Je bent een expert in het extraheren van technische specificaties uit product-datasheets voor duurzame energieproducten.

${categoryGuide}

KRITISCHE INSTRUCTIES:
1. Lees de tekst zorgvuldig en extraheer ALLE technische specificaties die je kunt vinden.
2. Map elke gevonden specificatie naar de EXACTE machine-key uit bovenstaande lijst.
3. Gebruik ALLEEN de machine-keys als key in extracted_specs. NIET de labels.
4. Voor boolean velden: gebruik "Ja" of "Nee".
5. Geef waarden ZONDER eenheid (de eenheid zit al in de key-naam). Voorbeeld: vermogen_wp: "410" (niet "410 Wp").
6. Als een waarde niet in de tekst staat, sla die key dan over.
7. Let op: afmetingen worden soms als "BxHxD" of "LxBxH" gegeven — splits naar lengte_mm, breedte_mm, hoogte_mm.
8. Decimale komma's converteren naar punten: "96,5" → "96.5".
9. Wees AGRESSIEF met zoeken — probeer zoveel mogelijk velden te vullen. Zoek ook in tabellen, voetnoten, kleine tekst.

Antwoord ALTIJD via de tool call.`,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_specs",
              description: "Return extracted product specifications from datasheet using exact machine-keys",
              parameters: {
                type: "object",
                properties: {
                  extracted_specs: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Extracted specifications using machine-keys. Values as strings without units.",
                  },
                  product_naam: { type: "string", description: "Product name found" },
                  product_merk: { type: "string", description: "Brand/manufacturer found" },
                  product_model: { type: "string", description: "Model number found" },
                  notes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Notes about the extraction",
                  },
                },
                required: ["extracted_specs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_specs" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw.", filled_count: 0 }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Krediet op, voeg tegoed toe.", filled_count: 0 }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI PDF extractie mislukt");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Geen AI respons ontvangen");

    const result = JSON.parse(toolCall.function.arguments);
    const rawSpecs = result.extracted_specs || {};

    // Step 3: Normalize + filter to allowed keys
    const allowedKeys = getAllowedKeys(categorie);
    const cleanedSpecs: Record<string, string> = {};
    const notes: string[] = result.notes || [];

    for (const [key, val] of Object.entries(rawSpecs)) {
      if (typeof val !== "string" || !val.trim()) continue;
      if (allowedKeys.size > 0 && !allowedKeys.has(key)) {
        notes.push(`Overgeslagen: "${key}" is geen bekende specificatie-key`);
        continue;
      }
      cleanedSpecs[key] = normalizeValue(key, val);
    }

    const filledCount = Object.keys(cleanedSpecs).length;
    console.log(`Extracted ${filledCount} specs after normalization`);

    if (filledCount === 0) {
      return new Response(JSON.stringify({
        error: "Geen specificaties gevonden in de PDF. Controleer of het een technische datasheet is met specificatietabellen.",
        extracted_specs: {},
        filled_count: 0,
        notes,
        extraction_method: isBase64 ? "pdf_binary" : "firecrawl_text",
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      extracted_specs: cleanedSpecs,
      product_naam: result.product_naam,
      product_merk: result.product_merk,
      product_model: result.product_model,
      notes,
      filled_count: filledCount,
      extraction_method: isBase64 ? "pdf_binary" : "firecrawl_text",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-parse-datasheet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout", filled_count: 0 }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
