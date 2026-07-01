import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/google/loadMaps";

type Prediction = { place_id: string; description: string };

interface Props {
  value: string;
  onChange: (waarde: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Beperking tot land, standaard NL. */
  land?: string;
}

/**
 * Adres-autocomplete via Google Places. Retourneert een genormaliseerd adres:
 * "Straat 12, 1234 AB Plaats". Valt terug op vrije tekst als Maps niet laadt.
 */
export default function AdresAutocomplete({
  value,
  onChange,
  placeholder = "Straat huisnr, postcode plaats",
  disabled,
  className,
  land = "nl",
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [suggesties, setSuggesties] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [gereed, setGereed] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<unknown>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        const g = (window as unknown as { google: any }).google;
        sessionRef.current = new g.maps.places.AutocompleteSessionToken();
        setGereed(true);
      })
      .catch((e: Error) => setFout(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const service = useMemo(() => {
    if (!gereed) return null;
    const g = (window as unknown as { google: any }).google;
    return new g.maps.places.AutocompleteService();
  }, [gereed]);

  const zoekSuggesties = (tekst: string) => {
    if (!service || tekst.trim().length < 3) {
      setSuggesties([]);
      return;
    }
    setBezig(true);
    service.getPlacePredictions(
      {
        input: tekst,
        sessionToken: sessionRef.current,
        componentRestrictions: { country: land },
        types: ["address"],
      },
      (res: Prediction[] | null) => {
        setBezig(false);
        setSuggesties(res ?? []);
      },
    );
  };

  const onInput = (val: string) => {
    setQuery(val);
    onChange(val);
    setOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => zoekSuggesties(val), 200);
  };

  const kiesSuggestie = (p: Prediction) => {
    const g = (window as unknown as { google: any }).google;
    const div = document.createElement("div");
    const places = new g.maps.places.PlacesService(div);
    places.getDetails(
      {
        placeId: p.place_id,
        fields: ["address_components", "formatted_address"],
        sessionToken: sessionRef.current,
      },
      (res: any, status: string) => {
        if (status !== "OK" || !res) {
          onChange(p.description);
          setQuery(p.description);
        } else {
          const c = res.address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
          const get = (t: string) => c.find((x) => x.types.includes(t))?.long_name ?? "";
          const straat = get("route");
          const nr = get("street_number");
          const postcode = get("postal_code");
          const plaats = get("locality") || get("postal_town") || get("administrative_area_level_2");
          const straatDeel = [straat, nr].filter(Boolean).join(" ");
          const plaatsDeel = [postcode, plaats].filter(Boolean).join(" ");
          const genormaliseerd = [straatDeel, plaatsDeel].filter(Boolean).join(", ") || res.formatted_address || p.description;
          onChange(genormaliseerd);
          setQuery(genormaliseerd);
        }
        setOpen(false);
        setSuggesties([]);
        // start nieuwe sessie na selectie (Google billing best practice)
        sessionRef.current = new g.maps.places.AutocompleteSessionToken();
      },
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={query}
        onChange={(e) => onInput(e.target.value)}
        onFocus={() => query && suggesties.length > 0 && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {bezig && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && suggesties.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-72 overflow-auto">
          {suggesties.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => kiesSuggestie(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>{s.description}</span>
            </button>
          ))}
        </div>
      )}
      {fout && <p className="text-xs text-muted-foreground mt-1">{fout} — je kunt het adres handmatig invoeren.</p>}
    </div>
  );
}