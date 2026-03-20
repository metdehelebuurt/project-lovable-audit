import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Machine-key definitions per category — mirrors categorySpecDefinitions.ts
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

const keyLabelMap: Record<string, string> = {
  vermogen_wp: "Vermogen (Wp)", efficiency_pct: "Efficiency (%)", celtype: "Celtype", aantal_cellen: "Aantal cellen",
  voc_v: "Voc (V)", isc_a: "Isc (A)", vmpp_v: "Vmpp (V)", impp_a: "Impp (A)",
  max_systeemspanning_v: "Max systeemspanning (V)", max_zekering_a: "Max zekering (A)",
  bifacial: "Bifacial (Ja/Nee)", bifacial_factor_pct: "Bifacial factor (%)",
  temp_coeff_pmax: "Temp.coëff. Pmax (%/°C)", temp_coeff_voc: "Temp.coëff. Voc (%/°C)",
  temp_coeff_isc: "Temp.coëff. Isc (%/°C)", noct_c: "NOCT (°C)",
  lengte_mm: "Lengte (mm)", breedte_mm: "Breedte (mm)", hoogte_mm: "Hoogte/Diepte (mm)",
  gewicht_kg: "Gewicht (kg)", ip_rating: "IP-rating", kleur: "Kleur",
  bedrijfstemperatuur_bereik: "Bedrijfstemperatuur (°C)", connectortype: "Connectortype",
  kabellengte_mm: "Kabellengte (mm)", kleur_frame: "Kleur frame", kleur_backsheet: "Kleur backsheet",
  glastype: "Glastype", glasdikte_mm: "Glasdikte (mm)",
  windbelasting_pa: "Windbelasting (Pa)", sneeuwbelasting_pa: "Sneeuwbelasting (Pa)", brandklasse: "Brandklasse",
  degradatie_jaar1_pct: "Degradatie jaar 1 (%)", degradatie_jaarlijks_pct: "Degradatie jaarlijks (%)",
  productgarantie_jaar: "Productgarantie (jaar)", vermogensgarantie_jaar: "Vermogensgarantie (jaar)",
  vermogensgarantie_pct: "Gegarandeerd vermogen na 25j (%)", certificeringen: "Certificeringen",
  land_van_herkomst: "Land van herkomst",
  bruikbare_capaciteit_kwh: "Bruikbare capaciteit (kWh)", nominale_capaciteit_kwh: "Nominale capaciteit (kWh)",
  dod_pct: "Depth of Discharge (%)", nominaal_vermogen_kw: "Nominaal vermogen continu (kW)",
  piekvermogen_kw: "Piekvermogen (kW)", max_laadstroom_a: "Max laadstroom (A)",
  max_ontlaadstroom_a: "Max ontlaadstroom (A)", roundtrip_efficiency_pct: "Roundtrip efficiëntie (%)",
  nominale_spanning_v: "Nominale spanning (V)", spanningsbereik_v: "Spanningsbereik (V)",
  fase: "Fase (1/3)", cycli: "Aantal cycli", verwachte_levensduur_jaar: "Verwachte levensduur (jaar)",
  montagetype: "Montagetype", opslagtemperatuur_bereik: "Opslagtemperatuur (°C)",
  wifi: "WiFi (Ja/Nee)", ethernet: "Ethernet (Ja/Nee)", rs485: "RS485 (Ja/Nee)",
  can_bus: "CAN bus (Ja/Nee)", bluetooth: "Bluetooth (Ja/Nee)", app_aanwezig: "App aanwezig (Ja/Nee)",
  monitoring_platform: "Monitoring platform", noodstroom: "Noodstroom/backup (Ja/Nee)",
  uitbreidbaar: "Uitbreidbaar (Ja/Nee)", max_modules_cascade: "Max modules in cascade",
  compatibele_omvormers: "Compatibele omvormers",
  type_warmtepomp: "Type warmtepomp", split_monoblock: "Uitvoering (split/monoblock)",
  verwarmingscapaciteit_a7w35_kw: "Verwarmingscapaciteit A7/W35 (kW)",
  verwarmingscapaciteit_a2w35_kw: "Verwarmingscapaciteit A2/W35 (kW)",
  verwarmingscapaciteit_a_7w35_kw: "Verwarmingscapaciteit A-7/W35 (kW)",
  cop_a7w35: "COP A7/W35", cop_a2w35: "COP A2/W35", scop: "SCOP",
  koelvermogen_kw: "Koelvermogen (kW)", eer: "EER", seer: "SEER",
  geluid_buitenunit_dba: "Geluidsniveau buitenunit (dB(A))",
  geluid_binnenunit_dba: "Geluidsniveau binnenunit (dB(A))",
  koudemiddel_type: "Koudemiddel type", gwp: "GWP", koudemiddel_hoeveelheid_kg: "Hoeveelheid koudemiddel (kg)",
  elektrisch_vermogen_max_kw: "Elektrisch vermogen max (kW)", aansluitspanning_v: "Aansluitspanning (V)",
  zekering_a: "Zekering (A)", max_watertemperatuur_c: "Max watertemperatuur (°C)",
  debiet_l_min: "Debiet (l/min)", wateraansluiting: "Wateraansluiting",
  buitenunit_breedte_mm: "Buitenunit breedte (mm)", buitenunit_hoogte_mm: "Buitenunit hoogte (mm)",
  buitenunit_diepte_mm: "Buitenunit diepte (mm)", buitenunit_gewicht_kg: "Buitenunit gewicht (kg)",
  binnenunit_breedte_mm: "Binnenunit breedte (mm)", binnenunit_hoogte_mm: "Binnenunit hoogte (mm)",
  binnenunit_diepte_mm: "Binnenunit diepte (mm)", binnenunit_gewicht_kg: "Binnenunit gewicht (kg)",
  energielabel_verwarming: "Energielabel verwarming", energielabel_warm_water: "Energielabel warm water",
  subsidiabel: "Subsidiabel ISDE (Ja/Nee)", smart_grid_ready: "Smart Grid Ready (Ja/Nee)",
  laadvermogen_kw: "Laadvermogen (kW)", connector_type: "Connector type",
  vaste_kabel: "Vaste kabel (Ja/Nee)", kabellengte_m: "Kabellengte (m)",
  smart_charging: "Smart charging (Ja/Nee)", load_balancing: "Load balancing (Ja/Nee)",
  dynamic_load_balancing: "Dynamic load balancing (Ja/Nee)", solar_charging: "Zonne-energie laden (Ja/Nee)",
  vehicle_to_grid: "Vehicle-to-Grid (Ja/Nee)", thuisbatterij_compatibel: "Thuisbatterij compatibel (Ja/Nee)",
  "4g_lte": "4G/LTE (Ja/Nee)", ocpp_versie: "OCPP versie",
  rfid: "RFID (Ja/Nee)", plug_and_charge: "Plug & Charge ISO 15118 (Ja/Nee)", pin_code: "PIN-code (Ja/Nee)",
  energiemeter_ingebouwd: "Energiemeter ingebouwd (Ja/Nee)", mid_gecertificeerd: "MID-gecertificeerd (Ja/Nee)",
  ik_rating: "IK-rating", installatiewijze: "Installatiewijze",
  type_omvormer: "Type omvormer", hybride: "Hybride/batterij-ready (Ja/Nee)",
  max_dc_vermogen_wp: "Max DC-vermogen (Wp)", max_dc_spanning_v: "Max DC-spanning (V)",
  mppt_bereik_v: "MPPT spanningsbereik (V)", aantal_mppt_trackers: "Aantal MPPT-trackers",
  strings_per_mppt: "Strings per MPPT", max_ingangsstroom_per_mppt_a: "Max ingangsstroom per MPPT (A)",
  max_kortsluitstroom_a: "Max kortsluitstroom (A)",
  nominaal_ac_vermogen_w: "Nominaal AC-vermogen (W)", max_ac_vermogen_va: "Max AC-vermogen (VA)",
  nominale_ac_spanning_v: "Nominale AC-spanning (V)", frequentie_hz: "Frequentie (Hz)",
  thd_pct: "THD (%)", power_factor: "Power factor",
  europees_rendement_pct: "Europees rendement (%)", max_rendement_pct: "Max rendement (%)",
  nachtverbruik_w: "Nachtverbruik (W)", koeling: "Koeling", max_hoogte_m: "Max installatiehoogte (m)",
  batterij_compatibel: "Batterij compatibel (Ja/Nee)", compatibele_batterijen: "Compatibele batterijen",
  max_batterij_stroom_a: "Max batterijstroom (A)",
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

    // Verify user
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

    // Fetch PDF from storage using service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const path = `datasheets/${product_id}.pdf`;
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("product-images")
      .download(path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "PDF niet gevonden in storage. Upload eerst een datasheet." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const pdfBase64 = btoa(binary);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categoryGuide = buildSpecPrompt(categorie);

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
            content: `Je bent een expert in het extraheren van technische specificaties uit product-datasheets (PDF's) voor duurzame energieproducten.

${categoryGuide}

KRITISCHE INSTRUCTIES:
1. Lees de PDF zorgvuldig en extraheer ALLE technische specificaties die je kunt vinden.
2. Map elke gevonden specificatie naar de EXACTE machine-key uit bovenstaande lijst.
3. Gebruik ALLEEN de machine-keys als key in extracted_specs. NIET de labels of eenheden in de key.
4. Voor boolean velden: gebruik "Ja" of "Nee".
5. Geef waarden ZONDER eenheid (de eenheid zit al in de key-naam). Bijvoorbeeld: vermogen_wp: "410" (niet "410 Wp").
6. Als een waarde niet in de PDF staat, sla die key dan over — vul NIET in met verzonnen data.
7. Extraheer ook de productnaam, merk, model als je die kunt vinden.

Antwoord ALTIJD via de tool call.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extraheer alle technische specificaties uit deze product-datasheet PDF voor de categorie "${categorie}". Map alle waarden naar de exacte machine-keys.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_specs",
              description: "Return extracted product specifications from PDF using exact machine-keys",
              parameters: {
                type: "object",
                properties: {
                  extracted_specs: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Extracted specifications using machine-keys (e.g. vermogen_wp, gewicht_kg). Values as strings without units.",
                  },
                  product_naam: {
                    type: "string",
                    description: "Product name found in the PDF",
                  },
                  product_merk: {
                    type: "string",
                    description: "Brand/manufacturer found in the PDF",
                  },
                  product_model: {
                    type: "string",
                    description: "Model number found in the PDF",
                  },
                  notes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Notes about the extraction (e.g. values that were unclear, specs not found)",
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
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Krediet op, voeg tegoed toe." }), {
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-parse-datasheet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
