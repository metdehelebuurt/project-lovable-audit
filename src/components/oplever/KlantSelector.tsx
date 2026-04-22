import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Search, Plus, X, User, Loader2 } from "lucide-react";

export interface KlantLite {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  bedrijfsnaam: string | null;
  email: string | null;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
}

interface Props {
  partnerId: string;
  klantId: string | null;
  onChange: (id: string | null, klant?: KlantLite) => void;
}

const formatNaam = (k: KlantLite) =>
  k.bedrijfsnaam || `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() || "(naamloos)";

const formatAdres = (k: KlantLite) =>
  [k.adres, [k.postcode, k.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ");

export default function KlantSelector({ partnerId, klantId, onChange }: Props) {
  const [selected, setSelected] = useState<KlantLite | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KlantLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nieuw, setNieuw] = useState({
    voornaam: "", achternaam: "", bedrijfsnaam: "", email: "",
    telefoon: "", adres: "", postcode: "", plaats: "",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Laad geselecteerde klant zodra klantId wijzigt
  useEffect(() => {
    let cancelled = false;
    if (!klantId) { setSelected(null); return; }
    if (selected?.id === klantId) return;
    (async () => {
      const { data } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, bedrijfsnaam, email, telefoon, adres, postcode, plaats")
        .eq("id", klantId)
        .maybeSingle();
      if (!cancelled && data) setSelected(data as KlantLite);
    })();
    return () => { cancelled = true; };
  }, [klantId, selected?.id]);

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, bedrijfsnaam, email, telefoon, adres, postcode, plaats")
        .eq("partner_id", partnerId)
        .or(`voornaam.ilike.%${q}%,achternaam.ilike.%${q}%,bedrijfsnaam.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);
      if (error) throw error;
      setResults((data as KlantLite[]) ?? []);
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

  const handleSelect = (k: KlantLite) => {
    setSelected(k);
    onChange(k.id, k);
    setQuery("");
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
  };

  const handleCreate = async () => {
    if (!nieuw.voornaam && !nieuw.achternaam && !nieuw.bedrijfsnaam) {
      toast.error("Vul minimaal naam of bedrijfsnaam in");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("klanten").insert({
        partner_id: partnerId,
        voornaam: nieuw.voornaam || null,
        achternaam: nieuw.achternaam || null,
        bedrijfsnaam: nieuw.bedrijfsnaam || null,
        email: nieuw.email || null,
        telefoon: nieuw.telefoon || null,
        adres: nieuw.adres || null,
        postcode: nieuw.postcode || null,
        plaats: nieuw.plaats || null,
      }).select("id, voornaam, achternaam, bedrijfsnaam, email, telefoon, adres, postcode, plaats").single();
      if (error) throw error;
      toast.success("Klant aangemaakt");
      handleSelect(data as KlantLite);
      setShowNewForm(false);
      setNieuw({ voornaam: "", achternaam: "", bedrijfsnaam: "", email: "", telefoon: "", adres: "", postcode: "", plaats: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Onbekende fout";
      toast.error("Fout bij aanmaken klant", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
        <User className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{formatNaam(selected)}</p>
          <p className="text-xs text-muted-foreground truncate">
            {selected.email ?? "—"}{formatAdres(selected) ? ` — ${formatAdres(selected)}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">Gekoppeld</Badge>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Popover open={showDropdown && (query.length >= 2 || results.length > 0)} onOpenChange={setShowDropdown}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Zoek klant op naam, bedrijf of e-mail…"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
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
              {results.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => handleSelect(k)}
                >
                  <p className="text-sm font-medium">{formatNaam(k)}</p>
                  <p className="text-xs text-muted-foreground">
                    {k.email ?? "—"}{k.plaats ? ` — ${k.plaats}` : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Geen resultaten</div>
          ) : null}
          <div className="border-t p-2">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent rounded-lg transition-colors"
              onClick={() => { setShowNewForm(true); setShowDropdown(false); }}
            >
              <Plus className="h-4 w-4" /> Nieuwe klant aanmaken
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {!showNewForm && !showDropdown && (
        <Button type="button" variant="outline" size="sm" className="rounded-pill gap-1" onClick={() => setShowNewForm(true)}>
          <Plus className="h-3 w-3" /> Nieuwe klant aanmaken
        </Button>
      )}

      {showNewForm && (
        <Card className="p-4 space-y-3 border-dashed">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Nieuwe klant</h4>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewForm(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Voornaam</Label><Input value={nieuw.voornaam} onChange={(e) => setNieuw((p) => ({ ...p, voornaam: e.target.value }))} className="rounded-xl h-9" /></div>
            <div><Label className="text-xs">Achternaam</Label><Input value={nieuw.achternaam} onChange={(e) => setNieuw((p) => ({ ...p, achternaam: e.target.value }))} className="rounded-xl h-9" /></div>
          </div>
          <div><Label className="text-xs">Bedrijfsnaam</Label><Input value={nieuw.bedrijfsnaam} onChange={(e) => setNieuw((p) => ({ ...p, bedrijfsnaam: e.target.value }))} className="rounded-xl h-9" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={nieuw.email} onChange={(e) => setNieuw((p) => ({ ...p, email: e.target.value }))} className="rounded-xl h-9" /></div>
            <div><Label className="text-xs">Telefoon</Label><Input value={nieuw.telefoon} onChange={(e) => setNieuw((p) => ({ ...p, telefoon: e.target.value }))} className="rounded-xl h-9" /></div>
          </div>
          <div><Label className="text-xs">Adres</Label><Input value={nieuw.adres} onChange={(e) => setNieuw((p) => ({ ...p, adres: e.target.value }))} className="rounded-xl h-9" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Postcode</Label><Input value={nieuw.postcode} onChange={(e) => setNieuw((p) => ({ ...p, postcode: e.target.value }))} className="rounded-xl h-9" /></div>
            <div><Label className="text-xs">Plaats</Label><Input value={nieuw.plaats} onChange={(e) => setNieuw((p) => ({ ...p, plaats: e.target.value }))} className="rounded-xl h-9" /></div>
          </div>
          <Button type="button" size="sm" className="rounded-pill gap-1" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Klant aanmaken & koppelen
          </Button>
        </Card>
      )}
    </div>
  );
}
