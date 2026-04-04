import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Loader2, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  adres?: string | null;
  postcode?: string | null;
  plaats?: string | null;
  compact?: boolean;
}

const scoreColors: Record<string, string> = {
  "Uitstekend": "bg-green-100 text-green-800",
  "Goed": "bg-emerald-100 text-emerald-700",
  "Matig": "bg-amber-100 text-amber-700",
  "Beperkt": "bg-red-100 text-red-700",
};

const SolarPotentieCheck = ({ adres, postcode, plaats, compact }: Props) => {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [coverageMode, setCoverageMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noCoverage, setNoCoverage] = useState(false);

  const fullAddress = [adres, postcode, plaats].filter(Boolean).join(", ");

  const check = async () => {
    if (!fullAddress) return;
    setLoading(true);
    setError(null);
    setNoCoverage(false);

    try {
      // Get API key via proxy for geocoding
      const { data: configData } = await supabase.functions.invoke("google-maps-config");
      const apiKey = configData?.apiKey;
      if (!apiKey) {
        setError("Google Maps niet geconfigureerd");
        setLoading(false);
        return;
      }

      // Geocode
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&components=country:NL&key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results?.[0]) {
        setError("Adres niet gevonden");
        setLoading(false);
        return;
      }

      const loc = geoData.results[0].geometry.location;

      const { data, error: fnErr } = await supabase.functions.invoke("solar-building-insights", {
        body: { lat: loc.lat, lng: loc.lng },
      });

      if (fnErr) throw fnErr;

      if (data?.status === "no_coverage") {
        setNoCoverage(true);
        setLoading(false);
        return;
      }

      if (data?.error) throw new Error(data.error);

      setScore(data.score);
      setCoverageMode(data.coverageMode || null);
    } catch (err: any) {
      setError("Solar check niet beschikbaar");
    }
    setLoading(false);
  };

  if (!fullAddress) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {score ? (
          <>
            <Badge className={scoreColors[score.label] || ""}>
              <Sun className="h-3 w-3 mr-1" /> {score.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ~{score.maxPanels} panelen • {score.yearlyEnergyAcKwh?.toLocaleString("nl-NL")} kWh/jr
            </span>
          </>
        ) : noCoverage ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Geen Solar dekking voor dit adres
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={check} disabled={loading} className="gap-1 text-xs h-7">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sun className="h-3 w-3" />}
            Zonnepotentie check
          </Button>
        )}
        {error && <span className="text-xs text-muted-foreground">{error}</span>}
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" /> Zonnepotentie
          </CardTitle>
          {!score && !noCoverage && (
            <Button variant="outline" size="sm" onClick={check} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Controleren
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {score ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={scoreColors[score.label] || ""}>{score.label}</Badge>
              <span className="text-sm text-muted-foreground">{score.maxSunHours} zonuren/jaar</span>
              {coverageMode && (
                <span className="text-xs text-muted-foreground">• {coverageMode}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Max. panelen</span>
                <span className="font-medium">{score.maxPanels}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Opbrengst</span>
                <span className="font-medium">{score.yearlyEnergyAcKwh?.toLocaleString("nl-NL")} kWh/jr</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Dakoppervlak</span>
                <span className="font-medium">{score.maxAreaM2} m²</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">CO₂ besparing</span>
                <span className="font-medium">{score.carbonOffsetKg?.toLocaleString("nl-NL")} kg/jr</span>
              </div>
            </div>
          </div>
        ) : noCoverage ? (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Geen Google Solar dekking beschikbaar voor dit adres. Dit is adresafhankelijk en betekent niet dat het dak ongeschikt is.</span>
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Klik om automatisch de zonnepotentie te controleren via Google Solar API.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SolarPotentieCheck;
