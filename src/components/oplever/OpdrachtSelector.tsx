import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X, ClipboardCheck, Loader2 } from "lucide-react";

interface OpdrachtLite {
  id: string;
  klant_naam: string | null;
  klant_email: string | null;
  status: string | null;
  created_at: string;
  lead_id: string | null;
}

interface Props {
  partnerId: string;
  opdrachtId: string | null;
  onChange: (id: string | null, opdracht?: OpdrachtLite) => void;
}

const formatDatum = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });

const labelVoor = (o: OpdrachtLite) => {
  const datum = formatDatum(o.created_at);
  return `${o.klant_naam ?? "(geen naam)"} — ${datum}`;
};

export default function OpdrachtSelector({ partnerId, opdrachtId, onChange }: Props) {
  const [selected, setSelected] = useState<OpdrachtLite | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpdrachtLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!opdrachtId) { setSelected(null); return; }
    if (selected?.id === opdrachtId) return;
    (async () => {
      const { data } = await supabase
        .from("opdrachten")
        .select("id, klant_naam, klant_email, status, created_at, lead_id")
        .eq("id", opdrachtId)
        .maybeSingle();
      if (!cancelled && data) setSelected(data as OpdrachtLite);
    })();
    return () => { cancelled = true; };
  }, [opdrachtId, selected?.id]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const search = useCallback(async (q: string) => {
    if (!partnerId) { setResults([]); return; }
    setLoading(true);
    try {
      let req = supabase
        .from("opdrachten")
        .select("id, klant_naam, klant_email, status, created_at, lead_id")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (q.length >= 2) {
        req = req.or(`klant_naam.ilike.%${q}%,klant_email.ilike.%${q}%`);
      }
      const { data, error } = await req;
      if (error) throw error;
      setResults((data as OpdrachtLite[]) ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const handleInput = (val: string) => {
    setQuery(val);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleFocus = () => {
    setShowDropdown(true);
    if (results.length === 0) void search("");
  };

  const handleSelect = (o: OpdrachtLite) => {
    setSelected(o);
    onChange(o.id, o);
    setQuery("");
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
        <ClipboardCheck className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{labelVoor(selected)}</p>
          <p className="text-xs text-muted-foreground truncate">
            {selected.klant_email ?? "—"}{selected.status ? ` — ${selected.status}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">Gekoppeld</Badge>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!partnerId) {
    return <div className="text-sm text-muted-foreground p-3 rounded-xl border bg-muted/20">Partner laden…</div>;
  }

  return (
    <Popover open={showDropdown} onOpenChange={setShowDropdown}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek verkooporder op klant of e-mail…"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={handleFocus}
            className="pl-10 rounded-xl"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[--radix-popover-trigger-width] max-h-64 overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {results.length > 0 ? (
          <div className="p-1">
            {results.map((o) => (
              <button
                key={o.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                onClick={() => handleSelect(o)}
              >
                <p className="text-sm font-medium">{labelVoor(o)}</p>
                <p className="text-xs text-muted-foreground">
                  {o.klant_email ?? "—"}{o.status ? ` — ${o.status}` : ""}
                </p>
              </button>
            ))}
          </div>
        ) : !loading ? (
          <div className="p-3 text-sm text-muted-foreground text-center">Geen verkooporders gevonden</div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}