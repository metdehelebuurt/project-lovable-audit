const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lat, lng, quality } = await req.json();

    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "lat en lng zijn verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY niet geconfigureerd" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qualities = quality ? [quality] : ["HIGH", "MEDIUM", "LOW"];

    // 1. Building Insights — try quality levels in order
    let insightsRes: Response | null = null;
    let usedQuality = qualities[0];
    for (const q of qualities) {
      usedQuality = q;
      const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=${q}&key=${GOOGLE_API_KEY}`;
      insightsRes = await fetch(url);
      if (insightsRes.ok) break;
      // Consume body before retrying
      await insightsRes.text();
    }

    if (!insightsRes || !insightsRes.ok) {
      return new Response(JSON.stringify({ error: "Geen zonnepotentie-data beschikbaar voor deze locatie. De Google Solar API heeft geen gebouwgegevens voor dit adres." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insights = await insightsRes.json();

    // Extract roof segments
    const roofSegments = insights.solarPotential?.roofSegmentStats || [];
    const maxSunHours = insights.solarPotential?.maxSunshineHoursPerYear || 0;
    const maxPanels = insights.solarPotential?.maxArrayPanelsCount || 0;
    const maxArea = insights.solarPotential?.maxArrayAreaMeters2 || 0;
    const carbonOffset = insights.solarPotential?.carbonOffsetFactorKgPerMwh || 0;

    // Best config for yield estimate
    const configs = insights.solarPotential?.solarPanelConfigs || [];
    const bestConfig = configs.length > 0 ? configs[configs.length - 1] : null;
    const yearlyEnergyDcKwh = bestConfig?.yearlyEnergyDcKwh || 0;

    // Azimuth to compass direction
    const azimuthToDirection = (az: number): string => {
      const dirs = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
      const idx = Math.round(az / 45) % 8;
      return dirs[idx];
    };

    // Map segments to clusters
    const clusters = roofSegments.map((seg: any, i: number) => ({
      naam: `Dakvlak ${i + 1}`,
      orientatie: azimuthToDirection(seg.azimuthDegrees || 0),
      hellingshoek: Math.round(seg.pitchDegrees || 0).toString(),
      aantal_panelen: (seg.stats?.areaMeters2 ? Math.floor(seg.stats.areaMeters2 / 1.7) : 0).toString(),
      oppervlakte_m2: Math.round(seg.stats?.areaMeters2 || 0),
      zonuren_per_jaar: Math.round(seg.stats?.sunshineQuantiles?.[10] || maxSunHours),
      schaduw: "onbekend",
      schaduw_bron: "",
      daktype: (seg.pitchDegrees || 0) < 10 ? "plat" : "schuin",
      vermogen_per_paneel_wp: "",
    }));

    // Calculate score
    let scoreLabel = "Beperkt";
    let scoreValue = 0;
    if (maxSunHours >= 1400) { scoreLabel = "Uitstekend"; scoreValue = 4; }
    else if (maxSunHours >= 1200) { scoreLabel = "Goed"; scoreValue = 3; }
    else if (maxSunHours >= 1000) { scoreLabel = "Matig"; scoreValue = 2; }
    else { scoreLabel = "Beperkt"; scoreValue = 1; }

    // 2. Data Layers (for heatmap URLs)
    let dataLayers = null;
    try {
      const layersUrl = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=50&view=FULL_LAYERS&requiredQuality=${qualityParam}&pixelSizeMeters=0.5&key=${GOOGLE_API_KEY}`;
      const layersRes = await fetch(layersUrl);
      if (layersRes.ok) {
        const layers = await layersRes.json();
        dataLayers = {
          dsmUrl: layers.dsmUrl || null,
          rgbUrl: layers.rgbUrl || null,
          annualFluxUrl: layers.annualFluxUrl || null,
          monthlyFluxUrl: layers.monthlyFluxUrl || null,
          maskUrl: layers.maskUrl || null,
          imageryDate: layers.imageryDate || null,
          imageryQuality: layers.imageryQuality || null,
        };
      }
    } catch (_e) {
      // Data layers optional
    }

    const result = {
      clusters,
      score: {
        label: scoreLabel,
        value: scoreValue,
        maxSunHours: Math.round(maxSunHours),
        maxPanels,
        maxAreaM2: Math.round(maxArea),
        yearlyEnergyDcKwh: Math.round(yearlyEnergyDcKwh),
        yearlyEnergyAcKwh: Math.round(yearlyEnergyDcKwh * 0.85),
        carbonOffsetKg: Math.round((yearlyEnergyDcKwh * 0.85 / 1000) * carbonOffset),
      },
      dataLayers,
      center: insights.center || { latitude: lat, longitude: lng },
      imageryDate: insights.imageryDate || null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
