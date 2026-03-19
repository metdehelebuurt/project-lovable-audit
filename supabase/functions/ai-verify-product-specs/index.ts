import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Full spec definitions per category — keys the AI should fill
const categorySpecKeys: Record<string, Record<string, string[]>> = {
  zonnepanelen: {
    "Elektrisch": ["Vermogen (Wp)", "Efficiency (%)", "Celtype", "Aantal cellen", "Voc (V)", "Isc (A)", "Vmpp (V)", "Impp (A)", "Max systeemspanning (V)", "Max zekering (A)", "Bifacial (ja/nee)", "Bifacial factor (%)"],
    "Thermisch": ["Temp.coëff. Pmax (%/°C)", "Temp.coëff. Voc (%/°C)", "Temp.coëff. Isc (%/°C)", "NOCT (°C)"],
    "Fysiek": ["Lengte (mm)", "Breedte (mm)", "Hoogte (mm)", "Gewicht (kg)", "IP-rating", "Connectortype", "Kabellengte (mm)", "Kleur frame", "Kleur backsheet", "Glastype", "Glasdikte (mm)"],
    "Mechanisch": ["Windbelasting (Pa)", "Sneeuwbelasting (Pa)", "Brandklasse"],
    "Prestatie": ["Degradatie jaar 1 (%)", "Degradatie jaarlijks (%)"],
    "Garantie": ["Productgarantie (jaar)", "Vermogensgarantie (jaar)", "Gegarandeerd vermogen na 25j (%)"],
    "Certificering": ["Certificeringen (IEC 61215, IEC 61730, etc.)"],
  },
  thuisbatterij: {
    "Capaciteit": ["Bruikbare capaciteit (kWh)", "Nominale capaciteit (kWh)", "Depth of Discharge (%)"],
    "Vermogen": ["Nominaal vermogen continu (kW)", "Piekvermogen (kW)", "Max laadstroom (A)", "Max ontlaadstroom (A)"],
    "Elektrisch": ["Celtype (LFP/NMC/LTO)", "Roundtrip efficiëntie (%)", "Nominale spanning (V)", "Spanningsbereik (V)", "Fase (1/3)"],
    "Levensduur": ["Aantal cycli", "Verwachte levensduur (jaar)"],
    "Fysiek": ["Lengte (mm)", "Breedte (mm)", "Hoogte (mm)", "Gewicht (kg)", "IP-rating", "Montagetype (wand/vloer)", "Bedrijfstemperatuur (°C)", "Opslagtemperatuur (°C)"],
    "Connectiviteit": ["WiFi (ja/nee)", "Ethernet (ja/nee)", "RS485 (ja/nee)", "CAN bus (ja/nee)", "Bluetooth (ja/nee)", "App aanwezig (ja/nee)", "Monitoring platform"],
    "Functionaliteit": ["Noodstroom/backup (ja/nee)", "Uitbreidbaar (ja/nee)", "Max modules in cascade", "Compatibele omvormers"],
    "Veiligheid": ["Brandklassificatie", "Certificeringen (IEC 62619, UN38.3, VDE)"],
    "Garantie": ["Productgarantie (jaar)"],
  },
  warmtepomp: {
    "Type": ["Type warmtepomp (lucht-water/lucht-lucht/bodem-water)", "Uitvoering (split/monoblock)"],
    "Prestatie": ["Verwarmingscapaciteit A7/W35 (kW)", "Verwarmingscapaciteit A2/W35 (kW)", "Verwarmingscapaciteit A-7/W35 (kW)", "COP A7/W35", "COP A2/W35", "SCOP"],
    "Koeling": ["Koelvermogen (kW)", "EER", "SEER"],
    "Geluid": ["Geluidsniveau buitenunit (dB(A))", "Geluidsniveau binnenunit (dB(A))"],
    "Koudemiddel": ["Koudemiddel type (R32/R290/R410A)", "GWP", "Hoeveelheid koudemiddel (kg)"],
    "Elektrisch": ["Elektrisch vermogen max (kW)", "Aansluitspanning (V)", "Zekering (A)", "Fase (1/3)"],
    "Water": ["Max watertemperatuur (°C)", "Debiet (l/min)", "Wateraansluiting"],
    "Fysiek buitenunit": ["Breedte (mm)", "Hoogte (mm)", "Diepte (mm)", "Gewicht (kg)"],
    "Fysiek binnenunit": ["Breedte (mm)", "Hoogte (mm)", "Diepte (mm)", "Gewicht (kg)"],
    "Energie": ["Energielabel verwarming", "Energielabel warm water"],
    "Subsidie": ["Subsidiabel ISDE (ja/nee)", "Smart Grid Ready (ja/nee)"],
    "Garantie": ["Productgarantie (jaar)", "Certificeringen (ErP, Keymark, MCS)"],
  },
  laadpaal: {
    "Laden": ["Laadvermogen (kW)", "Max laadstroom (A)", "Fase (1/3)", "Aansluitspanning (V)", "Connector type", "Vaste kabel (ja/nee)", "Kabellengte (m)"],
    "Smart functies": ["Smart charging (ja/nee)", "Load balancing (ja/nee)", "Dynamic load balancing (ja/nee)", "Zonne-energie laden (ja/nee)", "Vehicle-to-Grid (ja/nee)", "Thuisbatterij compatibel (ja/nee)"],
    "Connectiviteit": ["WiFi (ja/nee)", "4G/LTE (ja/nee)", "Ethernet (ja/nee)", "Bluetooth (ja/nee)", "OCPP versie", "App aanwezig (ja/nee)", "Monitoring platform"],
    "Authenticatie": ["RFID (ja/nee)", "Plug & Charge ISO 15118 (ja/nee)", "PIN-code (ja/nee)"],
    "Meting": ["Energiemeter ingebouwd (ja/nee)", "MID-gecertificeerd (ja/nee)"],
    "Fysiek": ["Lengte (mm)", "Breedte (mm)", "Hoogte (mm)", "Gewicht (kg)", "IP-rating", "IK-rating", "Installatiewijze (wand/paal)", "Bedrijfstemperatuur (°C)"],
    "Garantie": ["Productgarantie (jaar)", "Certificeringen (IEC 61851, CE)"],
  },
  omvormer: {
    "Type": ["Type omvormer (string/micro/hybride/batterij)", "Hybride/batterij-ready (ja/nee)"],
    "DC-zijde": ["Max DC-vermogen (Wp)", "Max DC-spanning (V)", "MPPT spanningsbereik (V)", "Aantal MPPT-trackers", "Strings per MPPT", "Max ingangsstroom per MPPT (A)", "Max kortsluitstroom (A)"],
    "AC-zijde": ["Nominaal AC-vermogen (W)", "Max AC-vermogen (VA)", "Fase (1/3)", "Nominale AC-spanning (V)", "Frequentie (Hz)", "THD (%)", "Power factor"],
    "Rendement": ["Europees rendement (%)", "Max rendement (%)", "Nachtverbruik (W)"],
    "Fysiek": ["Lengte (mm)", "Breedte (mm)", "Hoogte (mm)", "Gewicht (kg)", "IP-rating", "Koeling (natuurlijk/ventilator)", "Bedrijfstemperatuur (°C)", "Max installatiehoogte (m)"],
    "Communicatie": ["WiFi (ja/nee)", "Ethernet (ja/nee)", "RS485 (ja/nee)", "Monitoring platform", "App aanwezig (ja/nee)"],
    "Batterij": ["Batterij compatibel (ja/nee)", "Compatibele batterijen", "Max batterijstroom (A)"],
    "Garantie": ["Productgarantie (jaar)", "Certificeringen (VDE, EN 50549, IEC 62109)"],
  },
};

function buildSpecPrompt(categorie: string): string {
  const specs = categorySpecKeys[categorie];
  if (!specs) return "Gebruik je expertise om alle relevante specificaties voor dit type product te bepalen. Lever minimaal 15 specificaties.";
  
  const lines = [`VOLLEDIGE specificatielijst voor ${categorie} — vul ALLE onderstaande parameters in:`];
  for (const [group, keys] of Object.entries(specs)) {
    lines.push(`  ${group}: ${keys.join(", ")}`);
  }
  return lines.join("\n");
}

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
            content: `Je bent een expert in duurzame energieproducten (zonnepanelen, thuisbatterijen, warmtepompen, laadpalen, omvormers).
Je taak is om productspecificaties te verifiëren, corrigeren en VOLLEDIG aan te vullen zodat er een professioneel specificatieblad van gemaakt kan worden.

${categoryGuide}

BELANGRIJK:
1. Zoek het exacte product op basis van naam, merk en model. Gebruik ALLEEN correcte, verifieerbare specificaties.
2. Als je het product niet kent, maak dan GEEN specs op maar geef dit aan in suggestions.
3. Vul ALLE specificaties uit bovenstaande lijst aan — een professioneel datasheet moet compleet zijn.
4. Groepeer specificaties logisch.
5. Geef een professionele Nederlandse productomschrijving als die ontbreekt of verbeterd kan worden.
6. Alle labels en waarden in het Nederlands waar mogelijk.
7. Geef ALLE fysieke specificaties: gewicht, afmetingen, IP-rating, etc.
8. Geef ALLE connectiviteitsspecificaties: WiFi, Ethernet, app, monitoring, etc.

Antwoord ALTIJD via de tool call.`
          },
          {
            role: "user",
            content: `Verifieer en vul de volgende productspecificaties VOLLEDIG aan voor een professioneel specificatieblad:\n\n${productInfo}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_specs",
              description: "Return verified and complete product specifications for a professional datasheet",
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
                    description: "List of suggestions, warnings or notes about the specs (in Dutch)"
                  },
                  corrected_specs: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Complete set of ALL product specifications (key-value pairs, Dutch labels). Must include electrical, performance, physical dimensions, weight, connectivity, and functional specs."
                  },
                  installatie_specs: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Installation and physical specifications: dimensions (mm), weight (kg), IP-rating, mounting type, operating temperature range, cooling method, cable/connector details."
                  },
                  regelgeving: {
                    type: "string",
                    description: "Certifications, standards and regulatory compliance as a comma-separated string in Dutch"
                  },
                  omschrijving_suggestie: {
                    type: "string",
                    description: "Professional product description (2-4 sentences, in Dutch) highlighting key features and benefits"
                  }
                },
                required: ["verified", "suggestions", "corrected_specs", "installatie_specs"],
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
