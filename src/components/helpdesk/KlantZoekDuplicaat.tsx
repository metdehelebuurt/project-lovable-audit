import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, X, User, Loader2, AlertTriangle } from "lucide-react";

export type KlantMatch = {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string | null;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
};

interface Props {
  selected: KlantMatch | null;
  onSelect: (k: KlantMatch) => void;
  onClear: () => void;
}

export function KlantZoekDuplicaat({ selected, onSelect, onClear }: Props) {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KlantMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [dupes, setDupes] = useState<KlantMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", email: "", telefoon: "", adres: "", postcode: "", plaats: "" });
  const wrap = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2 || !profile?.partner_id) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats")
        .eq("partner_id", profile.partner_id)
        .or(`voornaam.ilike.%${q}%,achternaam.ilike.%${q}%,email.ilike.%${q}%,telefoon.ilike.%${q}%`)
        .limit(8);
      setResults((data ?? []) as KlantMatch[]);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    setQuery(v); setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 250);
  };

  const checkDupes = async () => {
    if (!form.email && !form.telefoon && !form.postcode) return;
    setChecking(true);
    try {
      const { data } = await supabase.functions.invoke("helpdesk-klant-duplicaat-check", {
        body: { email: form.email, telefoon: form.telefoon, postcode: form.postcode },
      });
      setDupes((data?.matches ?? []) as KlantMatch[]);
    } finally {
      setChecking(false);
    }
  };

  const create = async () => {
    if (!form.voornaam || !form.achternaam) {
      toast.error("Voornaam en achternaam zijn verplicht");
      return;
    }
    if (!profile?.partner_id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("klanten").insert({
        partner_id: profile.partner_id,
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        email: form.email || null,
        telefoon: form.telefoon || null,
        adres: form.adres || null,
        postcode: form.postcode || null,
        plaats: form.plaats || null,
      }).select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats").single();
      if (error) throw error;
      toast.success("Klant aangemaakt");
      onSelect(data as KlantMatch);
      setShowNew(false);
      setForm({ voornaam: "", achternaam: "", email: "", telefoon: "", adres: "", postcode: "", plaats: "" });
      setDupes([]);
    } catch (e) {
      toast.error(`Aanmaken mislukt: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
        <User className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{selected.voornaam} {selected.achternaam}</p>
          <p className="text-xs text-muted-foreground truncate">
            {selected.email || "geen e-mail"}{selected.plaats ? ` — ${selected.plaats}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">Gekoppeld</Badge>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={wrap} className="space-y-3 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek klant op naam, e-mail of telefoon…"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-10"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
      </div>

      {open && (query.length >= 2 || results.length > 0) && (
        <Card className="absolute z-50 w-full max-h-72 overflow-y-auto shadow-lg">
          {results.length > 0 ? (
            <div className="p-1">
              {results.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg"
                  onClick={() => { onSelect(k); setOpen(false); setQuery(""); }}
                >
                  <p className="text-sm font-medium">{k.voornaam} {k.achternaam}</p>
                  <p className="text-xs text-muted-foreground">{k.email || k.telefoon || "—"}{k.plaats ? ` — ${k.plaats}` : ""}</p>
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Geen klanten gevonden</div>
          ) : null}
          <div className="border-t p-2">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent rounded-lg"
              onClick={() => { setShowNew(true); setOpen(false); }}
            >
              <Plus className="h-4 w-4" /> Nieuwe klant aanmaken
            </button>
          </div>
        </Card>
      )}

      {!showNew && (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-3 w-3 mr-1" /> Nieuwe klant
        </Button>
      )}

      {showNew && (
        <Card className="p-4 space-y-3 border-dashed">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Nieuwe klant</h4>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNew(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Voornaam *</Label><Input value={form.voornaam} onChange={(e) => setForm((p) => ({ ...p, voornaam: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs">Achternaam *</Label><Input value={form.achternaam} onChange={(e) => setForm((p) => ({ ...p, achternaam: e.target.value }))} className="h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} onBlur={checkDupes} className="h-9" /></div>
            <div><Label className="text-xs">Telefoon</Label><Input value={form.telefoon} onChange={(e) => setForm((p) => ({ ...p, telefoon: e.target.value }))} onBlur={checkDupes} className="h-9" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3"><Label className="text-xs">Adres</Label><Input value={form.adres} onChange={(e) => setForm((p) => ({ ...p, adres: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={(e) => setForm((p) => ({ ...p, postcode: e.target.value }))} onBlur={checkDupes} className="h-9" /></div>
            <div className="col-span-2"><Label className="text-xs">Plaats</Label><Input value={form.plaats} onChange={(e) => setForm((p) => ({ ...p, plaats: e.target.value }))} className="h-9" /></div>
          </div>

          {checking && <p className="text-xs text-muted-foreground">Duplicaten controleren…</p>}
          {dupes.length > 0 && (
            <Card className="p-3 bg-warning-light border-warning/40 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
                <AlertTriangle className="h-4 w-4" />
                Mogelijk bestaande klant gevonden ({dupes.length})
              </div>
              {dupes.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full text-left rounded-md p-2 hover:bg-background"
                  onClick={() => { onSelect(d); setShowNew(false); setDupes([]); }}
                >
                  <p className="text-sm font-medium">{d.voornaam} {d.achternaam}</p>
                  <p className="text-xs text-muted-foreground">{d.email || d.telefoon || "—"}{d.plaats ? ` — ${d.plaats}` : ""}</p>
                </button>
              ))}
            </Card>
          )}

          <Button type="button" size="sm" onClick={create} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Klant aanmaken
          </Button>
        </Card>
      )}
    </div>
  );
}
