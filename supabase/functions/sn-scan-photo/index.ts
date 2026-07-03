import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  image: string; // data URL of https URL
  hint?: string | null; // e.g. product/merk om herkenning te sturen
}

interface Kandidaat {
  serienummer: string;
  confidence: number; // 0-1
  type?: string | null; // batterij / omvormer / backup_box / algemeen
  merk?: string | null;
  model?: string | null;
  label?: string | null; // waar het is gelezen (bv. "S/N", "PSN")
}

const SYSTEM = `Je bent een OCR-specialist voor apparatuurlabels (zonne-omvormers, thuisbatterijen, backup boxes, laadpalen, warmtepompen).
Je taak: haal ALLE serienummers uit de foto van het label.

Belangrijk:
- Serienummers staan meestal na labels als "S/N", "SN", "Serial No.", "Serial Number", "PSN", "MSN", "Product SN", of onder een barcode/QR-code.
- Negeer: modelnummers, artikelnummers, MAC-adressen, EAN/UPC/GTIN barcodes zelf (13 cijfers), datumcodes, batchcodes, IMEI's, WiFi-SSIDs.
- Serienummers zijn typisch 8-24 tekens, alfanumeriek, vaak met streepjes.
- Als er meerdere labels op de foto staan (bijv. omvormer + batterij + backup box), geef ze allemaal apart terug met type.
- Wees streng: alleen zaken die duidelijk als serienummer gemarkeerd zijn óf onder de hoofdbarcode staan.
- Confidence 0.0-1.0: hoe zeker ben je dat dit een serienummer is (niet een modelnummer).

Antwoord ALTIJD als JSON: {"kandidaten":[{"serienummer":"...","confidence":0.95,"type":"batterij|omvormer|backup_box|algemeen","merk":"...","model":"...","label":"S/N"}], "opmerking":"korte notitie als niks gevonden"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.image) return json({ error: "image is verplicht" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY ontbreekt" }, 500);

    const userText = body.hint
      ? `Context: dit label hoort bij "${body.hint}". Geef alle serienummers op de foto terug.`
      : `Geef alle serienummers op de foto terug.`;

    const messages = [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: body.image } },
        ],
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ error: "Te veel verzoeken, probeer later opnieuw." }, 429);
      if (aiRes.status === 402) return json({ error: "AI-tegoed op." }, 402);
      const txt = await aiRes.text();
      console.error("AI error:", aiRes.status, txt);
      return json({ error: "AI niet beschikbaar" }, 500);
    }

    const data = await aiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { kandidaten?: Kandidaat[]; opmerking?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { kandidaten: [], opmerking: "Kon AI-antwoord niet parsen" };
    }

    const kandidaten = (parsed.kandidaten ?? [])
      .filter((k) => k && typeof k.serienummer === "string" && k.serienummer.trim().length >= 4)
      .map((k) => ({
        serienummer: k.serienummer.trim().replace(/\s+/g, ""),
        confidence: Math.max(0, Math.min(1, Number(k.confidence ?? 0.6))),
        type: k.type ?? null,
        merk: k.merk ?? null,
        model: k.model ?? null,
        label: k.label ?? null,
      }));

    // Dedupliceer
    const uniek = new Map<string, Kandidaat>();
    kandidaten.forEach((k) => {
      const key = k.serienummer.toUpperCase();
      const bestaand = uniek.get(key);
      if (!bestaand || (k.confidence ?? 0) > (bestaand.confidence ?? 0)) uniek.set(key, k);
    });

    return json({ kandidaten: Array.from(uniek.values()), opmerking: parsed.opmerking ?? null });
  } catch (e) {
    console.error("sn-scan-photo error:", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}