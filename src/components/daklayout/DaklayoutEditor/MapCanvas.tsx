/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { paneelCorners } from "./PaneelLayoutEngine";
import type { Dakvlak, LatLng, Paneel } from "../types";

interface Props {
  centerAdres?: string;
  dakvlakken: Dakvlak[];
  panelen: Paneel[];
  paneelBreedteMm: number;
  paneelLengteMm: number;
  tekenModus: "polygoon" | "geen";
  geselecteerdDakvlakId: string | null;
  onPolygoonGetekend: (poly: LatLng[]) => void;
  onDakvlakSelect: (id: string) => void;
  onPaneelToevoegen: (center: LatLng) => void;
  onPaneelVerwijderen: (id: string) => void;
  onMapReady?: (el: HTMLElement) => void;
}

const DAKVLAK_KLEUREN = ["#9333ea", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const MapCanvas = ({
  centerAdres,
  dakvlakken,
  panelen,
  paneelBreedteMm,
  paneelLengteMm,
  tekenModus,
  geselecteerdDakvlakId,
  onPolygoonGetekend,
  onDakvlakSelect,
  onPaneelToevoegen,
  onPaneelVerwijderen,
  onMapReady,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingMgrRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const dakvlakOverlaysRef = useRef<google.maps.Polygon[]>([]);
  const paneelOverlaysRef = useRef<google.maps.Polygon[]>([]);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script (incl. drawing library)
  useEffect(() => {
    if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) {
      setLoaded(true);
      return;
    }
    (async () => {
      const { data, error: fnErr } = await supabase.functions.invoke("google-maps-config");
      if (fnErr || !data?.apiKey) {
        setError("Google Maps API key niet geconfigureerd");
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places,drawing,geometry`;
      script.async = true;
      script.onload = () => setLoaded(true);
      script.onerror = () => setError("Kan Google Maps niet laden");
      document.head.appendChild(script);
    })();
  }, []);

  // Init map
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: 52.1326, lng: 5.2913 },
      zoom: 8,
      mapTypeId: "satellite",
      tilt: 0,
      mapTypeControl: true,
      streetViewControl: false,
      rotateControl: false,
    });
    onMapReady?.(containerRef.current);
    // Geocode initial address if provided
    if (centerAdres) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: centerAdres }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          mapRef.current!.setCenter(results[0].geometry.location);
          mapRef.current!.setZoom(21);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Drawing manager: polygoon tekenen
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    if (!drawingMgrRef.current) {
      drawingMgrRef.current = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: "#9333ea",
          fillOpacity: 0.2,
          strokeColor: "#9333ea",
          strokeWeight: 2,
          editable: false,
          clickable: true,
        },
      });
      drawingMgrRef.current.setMap(mapRef.current);
      google.maps.event.addListener(drawingMgrRef.current, "polygoncomplete", (poly: google.maps.Polygon) => {
        const path = poly.getPath().getArray().map((p) => ({ lat: p.lat(), lng: p.lng() }));
        poly.setMap(null); // wordt opnieuw gerenderd vanuit state
        drawingMgrRef.current?.setDrawingMode(null);
        onPolygoonGetekend(path);
      });
    }
    drawingMgrRef.current.setDrawingMode(
      tekenModus === "polygoon" ? google.maps.drawing.OverlayType.POLYGON : null,
    );
  }, [loaded, tekenModus, onPolygoonGetekend]);

  // Render dakvlakken
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    dakvlakOverlaysRef.current.forEach((p) => p.setMap(null));
    dakvlakOverlaysRef.current = dakvlakken.map((dv, i) => {
      const kleur = DAKVLAK_KLEUREN[i % DAKVLAK_KLEUREN.length];
      const selected = dv.id === geselecteerdDakvlakId;
      const poly = new google.maps.Polygon({
        paths: dv.polygon,
        fillColor: kleur,
        fillOpacity: selected ? 0.25 : 0.1,
        strokeColor: kleur,
        strokeWeight: selected ? 3 : 2,
        map: mapRef.current!,
        clickable: true,
        zIndex: 1,
      });
      poly.addListener("click", () => onDakvlakSelect(dv.id));
      return poly;
    });
  }, [loaded, dakvlakken, geselecteerdDakvlakId, onDakvlakSelect]);

  // Render panelen
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    paneelOverlaysRef.current.forEach((p) => p.setMap(null));
    const dvMap = new Map(dakvlakken.map((d) => [d.id, d]));
    paneelOverlaysRef.current = panelen.flatMap((paneel) => {
      const dv = dvMap.get(paneel.dakvlakId);
      if (!dv) return [];
      const corners = paneelCorners(paneel, dv, paneelBreedteMm, paneelLengteMm);
      const poly = new google.maps.Polygon({
        paths: corners,
        fillColor: "#1e3a8a",
        fillOpacity: 0.7,
        strokeColor: "#fbbf24",
        strokeWeight: 1,
        map: mapRef.current!,
        clickable: true,
        zIndex: 2,
      });
      poly.addListener("click", () => onPaneelVerwijderen(paneel.id));
      return [poly];
    });
  }, [loaded, panelen, dakvlakken, paneelBreedteMm, paneelLengteMm, onPaneelVerwijderen]);

  // Klik op kaart → paneel toevoegen (alleen als dakvlak geselecteerd + niet in tekenmodus)
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }
    if (tekenModus === "geen" && geselecteerdDakvlakId) {
      clickListenerRef.current = mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        onPaneelToevoegen({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }
    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [loaded, tekenModus, geselecteerdDakvlakId, onPaneelToevoegen]);

  // Re-center on address change
  useEffect(() => {
    if (!loaded || !mapRef.current || !centerAdres) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: centerAdres }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        mapRef.current!.setCenter(results[0].geometry.location);
        mapRef.current!.setZoom(21);
      }
    });
  }, [loaded, centerAdres]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm p-4">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <div ref={containerRef} className="w-full h-[600px] rounded-xl overflow-hidden bg-muted" />;
};

export default MapCanvas;