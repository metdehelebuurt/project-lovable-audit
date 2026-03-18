import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const categoryEssentialSpecs: Record<string, string> = {
  zonnepanelen: `Essentiële specs voor zonnepanelen:
- Vermogen (Wp), Efficiency (%), Celtype (mono/poly/HJT/TOPCon), Aantal cellen
- Voc (V), Isc (A), Vmpp (V), Impp (A), Max systeemspanning (V)
- Afmetingen (LxBxH mm), Gewicht (kg), Kabellengte (mm), Connectortype
- Temperatuurcoëfficiënt Pmax (%/°C), Temperatuurcoëfficiënt Voc (%/°C)
- Wind-/sneeuwbelasting (Pa), IP-rating, Brandklasse
- Certificeringen (IEC 61215, IEC 61730), Productgarantie (jaar), Vermogensgarantie (jaar/%)
- Kleur frame, Kleur backsheet`,

  thuisbatterij: `Essentiële specs voor thuisbatterijen:
- Bruikbare capaciteit (kWh), Nominale capaciteit (kWh), Depth of Discharge (%)
- Nominaal vermogen continu (kW), Piekvermogen (kW)
- Roundtrip efficiëntie (%), Celtype (LFP/NMC)
- Nominale spanning (V), Spanningsbereik (V)
- Max laadstroom (A), Max ontlaadstroom (A)
- Aantal cycli (bij x% DoD), Verwachte levensduur (jaar)
- Afmetingen (BxHxD mm), Gewicht (kg), IP-rating, Montagetype (wand/vloer)
- Bedrijfstemperatuur (°C), Opslagtemperatuur (°C)
- Communicatie-interfaces (WiFi/Ethernet/RS485/CAN)
- Compatibele omvormers, Fase (1/3-fase)
- Certificeringen (IEC 62619, UN38.3, VDE), Brandklassificatie
- Uitbreidbaar (ja/nee), Max modules in cascade`,

  warmtepomp: `Essentiële specs voor warmtepompen:
- Type (lucht-water/lucht-lucht/bodem-water/water-water)
- Verwarmingscapaciteit (kW) bij A7/W35, bij A2/W35, bij A-7/W35
- COP bij A7/W35, bij A2/W35, SCOP
- Koelvermogen (kW), EER, SEER (indien koeling)
- Geluidsniveau buitenunit (dB(A)), Geluidsniveau binnenunit (dB(A))
- Koudemiddel type (R32/R290/R410A), GWP, Hoeveelheid (kg)
- Elektrisch vermogen max (kW), Aansluitspanning (V), Zekering (A), Fase (1/3)
- Verwarmingswater max temperatuur (°C), Debiet (l/min)
- Afmetingen buitenunit (BxHxD mm), Gewicht buitenunit (kg)
- Afmetingen binnenunit (BxHxD mm), Gewicht binnenunit (kg)
- Bedrijfstemperatuur bereik (°C tot °C)
- Energielabel verwarming, Energielabel warm water
- Certificeringen (ErP, Keymark, BAFA/ISDE geschikt, MCS)
- Subsidiabel (ja/nee)`,

  laadpaal: `Essentiële specs voor laadpalen:
- Laadvermogen (kW), Max laadstroom (A), Fase (1/3)
- Aansluitspanning (V), Type connector (Type 1/Type 2/CCS/CHAdeMO)
- Kabellengte (m), Vaste kabel (ja/nee)
- Smart charging (ja/nee), Load balancing (ja/nee)
- Communicatie (WiFi/4G/Ethernet/Bluetooth), Protocol (OCPP versie)
- Authenticatie (RFID/app/plug&charge)
- Energiemeter ingebouwd (ja/nee), MID-gecertificeerd (ja/nee)
- Afmetingen (BxHxD mm), Gewicht (kg), IP-rating, IK-rating
- Bedrijfstemperatuur (°C), Installatiewijze (paal/wand)
- Certificeringen (IEC 61851, CE), Geschikt voor zonne-energie/thuisbatterij
- Productgarantie (jaar)`,

  omvormer: `Essentiële specs voor omvormers:
- Type (string/micro/hybride/batterij)
- Max DC-vermogen (Wp), Nominaal AC-vermogen (W), Max AC-vermogen (VA)
- Max DC-spanning (V), MPPT bereik (V), Aantal MPPT-trackers, Strings per MPPT
- Max ingangsstroom per MPPT (A), Max kortsluitstroom (A)
- Europees rendement (%), Max rendement (%)
- Fase (1/3), Nominale AC-spanning (V), Frequentie (Hz)
- THD (<x%), Power factor, Nachtverbruik (W)
- Afmetingen (BxHxD mm), Gewicht (kg), IP-rating, Koeling (natuurlijk/ventilator)
- Bedrijfstemperatuur (°C), Max hoogte (m)
- Communicatie (WiFi/Ethernet/RS485), Monitoring platform
- Certificeringen (VDE, EN 50549, IEC 62109)
- Productgarantie (jaar), Uitbreidbare garantie`,
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

    const categoryGuide = categoryEssentialSpecs[categorie] || "Gebruik je expertise om de juiste specificaties te bepalen voor dit type product.";

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
3. Vul ALLE essentiële specificaties aan die ontbreken — een professioneel datasheet moet compleet zijn.
4. Groepeer specificaties logisch: technische specs apart, installatie specs apart.
5. Geef een professionele Nederlandse productomschrijving als die ontbreekt of verbeterd kan worden.
6. Alle labels en waarden in het Nederlands waar mogelijk.

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
                    description: "Complete set of TECHNICAL product specifications (key-value pairs, Dutch labels). Include electrical, performance, and functional specs."
                  },
                  installatie_specs: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Installation and physical specifications: dimensions (mm), weight (kg), IP-rating, mounting type, operating temperature range, cooling method, cable/connector details."
                  },
                  regelgeving: {
                    type: "string",
                    description: "Certifications, standards and regulatory compliance (e.g. IEC, VDE, CE, ErP) as a comma-separated string in Dutch"
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
