import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft, Search, Check, Trash2, Zap, Loader2,
  Sun, Thermometer, Home, Layers, Square, Wind, Battery,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

const categorieConfig: { key: SchouwCategorie; label: string; icon: React.ElementType }[] = [
  { key: "zonnepanelen", label: "Zonnepanelen", icon: Sun },
  { key: "warmtepomp", label: "Warmtepomp", icon: Thermometer },
  { key: "isolatie_dak", label: "Isolatie dak", icon: Home },
  { key: "isolatie_muur", label: "Isolatie muur", icon: Layers },
  { key: "isolatie_vloer", label: "Isolatie vloer", icon: Square },
  { key: "hr_glas", label: "HR++ glas", icon: Square },
  { key: "ventilatie", label: "Ventilatie", icon: Wind },
  { key: "thuisbatterij", label: "Thuisbatterij", icon: Battery },
];

const generateSchouwNummer = () => `SCH-${Date.now().toString(36).toUpperCase()}`;

const SchouwSnelstart = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedCat, setSelectedCat] = useState<SchouwCategorie | null>(null);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-snelstart"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, voornaam, achternaam, email");
      if (error) throw error;
      return data;
    },
  });

  const filteredLeads = leads.filter(l => {
    if (!leadSearch || leadSearch.length < 2) return false;
    const q = leadSearch.toLowerCase();
    return `${l.voornaam} ${l.achternaam}`.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  const handleStart = async () => {
    if (!selectedCat || !selectedLeadId) return;
    setCreating(true);
    try {
      const lead = leads.find(l => l.id === selectedLeadId);
      const record = {
        categorie: selectedCat,
        geplande_datum: new Date().toISOString().slice(0, 10),
        consument_naam: lead ? `${lead.voornaam} ${lead.achternaam}` : null,
        klant_email: lead?.email || null,
        lead_id: selectedLeadId,
        partner_id: profile?.partner_id!,
        adviseur_id: profile?.id!,
        schouw_nummer: generateSchouwNummer(),
      };
      const { data, error } = await supabase.from("schouwen").insert(record).select("id").single();
      if (error) throw error;
      toast.success("Schouw aangemaakt");
      navigate(`/schouwen/${data.id}/uitvoeren`);
    } catch (err: any) {
      toast.error("Fout bij aanmaken", { description: err.message });
    }
    setCreating(false);
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/schouwen")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Direct schouw starten</h1>
          <p className="text-sm text-muted-foreground">Selecteer een categorie en lead om meteen te beginnen</p>
        </div>
      </div>

      {/* Step 1: Categorie */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Categorie</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categorieConfig.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCat(key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedCat === key
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border hover:border-primary/40 text-foreground"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Lead */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Lead selecteren</Label>
        {selectedLeadId && selectedLead ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{selectedLead.voornaam} {selectedLead.achternaam}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedLead.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => { setSelectedLeadId(""); setLeadSearch(""); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam of e-mail..."
                value={leadSearch}
                onChange={e => { setLeadSearch(e.target.value); setSelectedLeadId(""); }}
                className="pl-10 rounded-xl"
              />
            </div>
            {filteredLeads.length > 0 && (
              <Card>
                <CardContent className="p-0 max-h-60 overflow-y-auto divide-y divide-border">
                  {filteredLeads.slice(0, 10).map(lead => (
                    <button
                      key={lead.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                      onClick={() => { setSelectedLeadId(lead.id); setLeadSearch(`${lead.voornaam} ${lead.achternaam}`); }}
                    >
                      <p className="font-medium text-foreground">{lead.voornaam} {lead.achternaam}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
            {leadSearch.length >= 2 && filteredLeads.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Geen leads gevonden</p>
            )}
          </>
        )}
      </div>

      {/* Action */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => navigate("/schouwen")} className="rounded-pill">
          Annuleren
        </Button>
        <Button
          disabled={!selectedCat || !selectedLeadId || creating}
          onClick={handleStart}
          className="rounded-pill gap-2 flex-1 sm:flex-none"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Schouw starten
        </Button>
      </div>
    </div>
  );
};

export default SchouwSnelstart;
