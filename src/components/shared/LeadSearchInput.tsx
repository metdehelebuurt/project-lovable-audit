import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, X, User, Loader2 } from "lucide-react";

interface Lead {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
}

interface LeadSearchInputProps {
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onClearLead: () => void;
}

export function LeadSearchInput({ selectedLead, onSelectLead, onClearLead }: LeadSearchInputProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLead, setNewLead] = useState({ voornaam: "", achternaam: "", email: "", telefoon: "", adres: "", postcode: "", plaats: "" });
  const [saving, setSaving] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchLeads = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      if (profile?.rol === "affiliate") {
        const { data, error } = await supabase
          .from("affiliate_leads")
          .select("id, bedrijfsnaam, contactpersoon, email, telefoon, adres, postcode, plaats")
          .or(`bedrijfsnaam.ilike.%${q}%,contactpersoon.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(10);
        if (error) throw error;
        const mapped: Lead[] = (data ?? []).map((r) => {
          const naamParts = (r.contactpersoon ?? r.bedrijfsnaam ?? "").trim().split(/\s+/);
          return {
            id: r.id,
            voornaam: naamParts[0] ?? "",
            achternaam: naamParts.slice(1).join(" ") || (r.bedrijfsnaam ?? ""),
            email: r.email ?? "",
            telefoon: r.telefoon ?? null,
            adres: r.adres ?? null,
            postcode: r.postcode ?? null,
            plaats: r.plaats ?? null,
            _bedrijfsnaam: r.bedrijfsnaam ?? null,
            _isAffiliate: true,
          } as Lead;
        });
        setResults(mapped);
      } else {
        const { data, error } = await supabase
          .from("leads")
          .select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats")
          .or(`voornaam.ilike.%${q}%,achternaam.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(10);
        if (error) throw error;
        setResults(data || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.rol]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLeads(val), 300);
  };

  const handleSelect = (lead: Lead) => {
    onSelectLead(lead);
    setQuery("");
    setShowDropdown(false);
  };

  const handleCreateLead = async () => {
    if (!newLead.voornaam || !newLead.achternaam || !newLead.email) {
      toast.error("Vul minimaal voornaam, achternaam en e-mail in");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("leads").insert({
        voornaam: newLead.voornaam,
        achternaam: newLead.achternaam,
        email: newLead.email,
        telefoon: newLead.telefoon || null,
        adres: newLead.adres || null,
        postcode: newLead.postcode || null,
        plaats: newLead.plaats || null,
        partner_id: profile?.partner_id!,
        owner_user_id: profile?.id!,
      }).select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats").single();
      if (error) throw error;
      toast.success("Lead aangemaakt");
      onSelectLead(data);
      setShowNewForm(false);
      setNewLead({ voornaam: "", achternaam: "", email: "", telefoon: "", adres: "", postcode: "", plaats: "" });
    } catch (err: any) {
      toast.error("Fout bij aanmaken lead", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (selectedLead) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
        <User className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{selectedLead.voornaam} {selectedLead.achternaam}</p>
          <p className="text-xs text-muted-foreground truncate">{selectedLead.email}{selectedLead.plaats ? ` — ${selectedLead.plaats}` : ""}</p>
        </div>
        <Badge variant="outline" className="shrink-0">Gekoppeld</Badge>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClearLead}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek lead op naam of e-mail..."
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          className="pl-10 rounded-xl"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {showDropdown && (query.length >= 2 || results.length > 0) && (
        <Card className="absolute z-50 w-full max-h-64 overflow-y-auto shadow-lg border">
          {results.length > 0 ? (
            <div className="p-1">
              {results.map(lead => (
                <button
                  key={lead.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => handleSelect(lead)}
                >
                  <p className="text-sm font-medium">{lead.voornaam} {lead.achternaam}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}{lead.plaats ? ` — ${lead.plaats}` : ""}</p>
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
              <Plus className="h-4 w-4" /> Nieuwe lead toevoegen
            </button>
          </div>
        </Card>
      )}

      {!showNewForm && !showDropdown && (
        <Button type="button" variant="outline" size="sm" className="rounded-pill gap-1" onClick={() => setShowNewForm(true)}>
          <Plus className="h-3 w-3" /> Nieuwe lead aanmaken
        </Button>
      )}

      {showNewForm && (
        <Card className="p-4 space-y-3 border-dashed">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Nieuwe lead</h4>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewForm(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Voornaam *</Label><Input value={newLead.voornaam} onChange={e => setNewLead(p => ({ ...p, voornaam: e.target.value }))} className="rounded-xl h-9" /></div>
            <div><Label className="text-xs">Achternaam *</Label><Input value={newLead.achternaam} onChange={e => setNewLead(p => ({ ...p, achternaam: e.target.value }))} className="rounded-xl h-9" /></div>
          </div>
          <div><Label className="text-xs">E-mail *</Label><Input type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} className="rounded-xl h-9" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Telefoon</Label><Input value={newLead.telefoon} onChange={e => setNewLead(p => ({ ...p, telefoon: e.target.value }))} className="rounded-xl h-9" /></div>
            <div><Label className="text-xs">Adres</Label><Input value={newLead.adres} onChange={e => setNewLead(p => ({ ...p, adres: e.target.value }))} className="rounded-xl h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Postcode</Label><Input value={newLead.postcode} onChange={e => setNewLead(p => ({ ...p, postcode: e.target.value }))} className="rounded-xl h-9" /></div>
            <div><Label className="text-xs">Plaats</Label><Input value={newLead.plaats} onChange={e => setNewLead(p => ({ ...p, plaats: e.target.value }))} className="rounded-xl h-9" /></div>
          </div>
          <Button type="button" size="sm" className="rounded-pill gap-1" onClick={handleCreateLead} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Lead aanmaken & koppelen
          </Button>
        </Card>
      )}
    </div>
  );
}
