/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, AlertCircle } from "lucide-react";

interface Props {
  adres?: string;
  plaats?: string;
  postcode?: string;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const SchouwSatellietKaart = ({ adres, plaats, postcode }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const defaultAddress = [adres, postcode, plaats].filter(Boolean).join(", ");

  // Load Google Maps script
  useEffect(() => {
    if (!MAPS_API_KEY) {
      setError("Google Maps API key niet geconfigureerd. Voeg VITE_GOOGLE_MAPS_API_KEY toe.");
      return;
    }
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Kan Google Maps niet laden");
    document.head.appendChild(script);
  }, []);

  const geocodeAndCenter = useCallback((address: string) => {
    if (!(window as any).google?.maps || !mapInstance.current) return;
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        mapInstance.current!.setCenter(loc);
        mapInstance.current!.setZoom(20);
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new (window as any).google.maps.Marker({
          position: loc,
          map: mapInstance.current!,
          title: address,
        });
      }
    });
  }, []);

  // Init map
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

  if (error) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Satellietweergave</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600 text-sm">
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
        <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Satellietweergave</CardTitle>
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
        </div>
        <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden bg-muted" />
        <p className="text-xs text-muted-foreground">Zoom in om de zonnepanelen op het dak visueel te inspecteren</p>
      </CardContent>
    </Card>
  );
};

export default SchouwSatellietKaart;
