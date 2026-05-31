/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, AlertCircle, Loader2, Sun, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { PaneelCluster } from "./PaneelClusterEditor";

export interface SolarScore {
  label: string;
  value: number;
  maxSunHours: number;
  maxPanels: number;
  maxAreaM2: number;
  yearlyEnergyDcKwh: number;
  yearlyEnergyAcKwh: number;
  carbonOffsetKg: number;
}

export interface SolarResult {
  clusters: PaneelCluster[];
  score: SolarScore;
  dataLayers: any;
  center: { latitude: number; longitude: number };
}

interface Props {
  adres?: string;
  plaats?: string;
  postcode?: string;
  onSolarData?: (data: SolarResult) => void;
}

const scoreColors: Record<string, string> = {
  "Uitstekend": "bg-green-100 text-green-800",
  "Goed": "bg-emerald-100 text-emerald-700",
  "Matig": "bg-amber-100 text-amber-700",
  "Beperkt": "bg-red-100 text-red-700",
};

const SchouwSatellietKaart = ({ adres, plaats, postcode, onSolarData }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [solarLoading, setSolarLoading] = useState(false);
  const [solarScore, setSolarScore] = useState<SolarScore | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  const defaultAddress = [adres, postcode, plaats].filter(Boolean).join(", ");

  useEffect(() => {
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }
    // Fetch API key from edge function
    const loadMaps = async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("google-maps-config");
        if (fnErr || !data?.apiKey) {
          setError("Google Maps API key niet geconfigureerd. Voeg GOOGLE_MAPS_API_KEY toe als secret.");
          return;
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => setLoaded(true);
        script.onerror = () => setError("Kan Google Maps niet laden");
        document.head.appendChild(script);
      } catch {
        setError("Kan Google Maps configuratie niet ophalen");
      }
    };
    loadMaps();
  }, []);

  const geocodeAndCenter = useCallback((address: string) => {
    if (!(window as any).google?.maps || !mapInstance.current) return;
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        mapInstance.current!.setCenter(loc);
        mapInstance.current!.setZoom(20);
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new (window as any).google.maps.Marker({
          position: loc,
          map: mapInstance.current!,
          title: address,
        });
        setLastCoords({ lat, lng });
      }
    });
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstance.current) return;
    mapInstance.current = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 52.1326, lng: 5.2913 },
      zoom: 8,
      mapTypeId: "satellite",
      tilt: 0,
      mapTypeControl: true,
      streetViewControl: false,
    });
    if (defaultAddress) {
      geocodeAndCenter(defaultAddress);
    }
  }, [loaded, defaultAddress, geocodeAndCenter]);

  const handleSearch = () => {
    const q = searchQuery.trim() || defaultAddress;
    if (q) geocodeAndCenter(q);
  };

  const fetchSolarData = async () => {
    if (!lastCoords) {
      // Try geocoding first
      if (!defaultAddress) return;
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: defaultAddress }, async (results: any, status: string) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          await doFetchSolar(loc.lat(), loc.lng());
        }
      });
      return;
    }
    await doFetchSolar(lastCoords.lat, lastCoords.lng);
  };

  const doFetchSolar = async (lat: number, lng: number) => {
    setSolarLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("solar-building-insights", {
        body: { lat, lng },
      });
      if (fnError) throw fnError;

      if (data?.status === "no_coverage") {
        setError("Geen Google Solar dekking voor dit adres. Handmatige invoer blijft mogelijk.");
        setSolarLoading(false);
        return;
      }

      if (data?.error) throw new Error(data.error);

      setSolarScore(data.score);
      if (data.coverageMode) {
        console.log("Solar coverage:", data.coverageMode, "quality:", data.usedQuality);
      }
      onSolarData?.(data as SolarResult);
    } catch (err: any) {
      console.error("Solar API error:", err);
      setError("Solar API niet beschikbaar. Controleer of de Solar API is ingeschakeld in Google Cloud Console.");
    }
    setSolarLoading(false);
  };

  if (error && !loaded) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Satellietweergave</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Satellietweergave & Zonnepotentie</CardTitle>
          {solarScore && (
            <Badge className={scoreColors[solarScore.label] || ""}>
              <Sun className="h-3 w-3 mr-1" />
              {solarScore.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder={defaultAddress || "Voer adres in..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={fetchSolarData}
            disabled={solarLoading}
            className="gap-2 shrink-0"
          >
            {solarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sun className="h-4 w-4" />}
            Dakgegevens ophalen
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
            <Link
              to={`/tools/daklayout?adres=${encodeURIComponent(adres || "")}&postcode=${encodeURIComponent(postcode || "")}&plaats=${encodeURIComponent(plaats || "")}`}
              target="_blank"
            >
              <MapPin className="h-4 w-4" /> Daklayout intekenen
            </Link>
          </Button>
        </div>

        <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden bg-muted" />

        {/* Solar score summary */}
        {solarScore && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Zonnepotentie analyse
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Max. zonuren/jaar</span>
                <span className="font-semibold">{solarScore.maxSunHours}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Max. panelen</span>
                <span className="font-semibold">{solarScore.maxPanels}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Geschatte opbrengst</span>
                <span className="font-semibold">{solarScore.yearlyEnergyAcKwh.toLocaleString("nl-NL")} kWh/jaar</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">CO₂ besparing</span>
                <span className="font-semibold">{solarScore.carbonOffsetKg.toLocaleString("nl-NL")} kg/jaar</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Geschikt dakoppervlak:</span>
              <span className="text-xs font-medium">{solarScore.maxAreaM2} m²</span>
            </div>
          </div>
        )}

        {error && loaded && (
          <div className="flex items-center gap-2 text-amber-600 text-xs">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Zoom in om de zonnepanelen op het dak visueel te inspecteren. Klik "Dakgegevens ophalen" voor automatische dakanalyse via Google Solar API.
        </p>
      </CardContent>
    </Card>
  );
};

export default SchouwSatellietKaart;
