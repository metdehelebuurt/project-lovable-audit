import { supabase } from "@/integrations/supabase/client";

let loadingPromise: Promise<void> | null = null;

/**
 * Laadt de Google Maps JS API één keer per sessie via de google-maps-config
 * edge function. Voegt places + geometry toe.
 */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as unknown as { google?: { maps?: unknown } };
  if (w.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { data, error } = await supabase.functions.invoke("google-maps-config");
    if (error || !data?.apiKey) {
      loadingPromise = null;
      throw new Error("Google Maps niet geconfigureerd");
    }
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Kan Google Maps niet laden")));
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Kan Google Maps niet laden"));
      document.head.appendChild(script);
    });
  })();

  return loadingPromise;
}