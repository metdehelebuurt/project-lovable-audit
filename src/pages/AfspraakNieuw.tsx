import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadSearchInput } from "@/components/shared/LeadSearchInput";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, Video, Phone, User, Clock, Save } from "lucide-react";

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

interface TeamUser {
  id: string;
  voornaam: string;
  achternaam: string;
  rol: string;
}

const AfspraakNieuw = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const presetLeadId = searchParams.get("lead_id");

  const [form, setForm] = useState({
    titel: "",
    type: "thuisbezoek",
    datum: new Date().toISOString().slice(0, 10),
    start_tijd: "",
    eind_tijd: "",
    locatie: "",
    notities: "",
    adviseur_id: profile?.id || "",
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // Fetch team users
  useEffect(() => {
    if (!profile?.partner_id) return;
    supabase
      .from("users")
      .select("id, voornaam, achternaam, rol")
      .eq("partner_id", profile.partner_id!)
      .in("rol", ["adviseur", "partner_staff", "partner_admin", "backoffice"])
      .eq("status", "actief")
      .then(({ data }) => {
        if (data) setTeamUsers(data as TeamUser[]);
      });
  }, [profile?.partner_id]);

  // Set default adviseur_id
  useEffect(() => {
    if (profile?.id && !form.adviseur_id) {
      setForm(prev => ({ ...prev, adviseur_id: profile.id }));
    }
  }, [profile?.id]);

  // Pre-load lead if lead_id in URL
  useEffect(() => {
    if (!presetLeadId) return;
    supabase
      .from("leads")
      .select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats, owner_user_id, toegewezen_aan")
      .eq("id", presetLeadId)
      .single()
      .then(({ data }) => {
        if (data) {
          setSelectedLead(data);
          // Pre-fill location from lead address
          if (data.adres) {
            setForm(prev => ({
              ...prev,
              locatie: [data.adres, data.postcode, data.plaats].filter(Boolean).join(", "),
              adviseur_id: data.toegewezen_aan || data.owner_user_id || prev.adviseur_id,
            }));
          }
        }
      });
  }, [presetLeadId]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    if (lead.adres) {
      setForm(prev => ({
        ...prev,
        locatie: prev.locatie || [lead.adres, lead.postcode, lead.plaats].filter(Boolean).join(", "),
      }));
    }
  };

  const handleSave = async () => {
    if (!form.titel.trim()) { toast.error("Titel is verplicht"); return; }
    if (!form.datum) { toast.error("Datum is verplicht"); return; }
    if (!profile?.partner_id) { toast.error("Geen partner gekoppeld"); return; }

    setSaving(true);
    const { error } = await supabase.from("afspraken" as any).insert({
      partner_id: profile.partner_id,
      adviseur_id: form.adviseur_id || profile.id,
      lead_id: selectedLead?.id || null,
      titel: form.titel.trim(),
      type: form.type,
      datum: form.datum,
      start_tijd: form.start_tijd || null,
      eind_tijd: form.eind_tijd || null,
      locatie: form.locatie.trim() || null,
      notities: form.notities.trim() || null,
      status: "gepland",
    } as any);
    setSaving(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Afspraak ingepland");
    navigate("/planning");
  };

  const typeIcons: Record<string, React.ReactNode> = {
    thuisbezoek: <MapPin className="h-4 w-4" />,
    op_afstand: <Video className="h-4 w-4" />,
    belafspraak: <Phone className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/planning")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Nieuwe afspraak</h1>
          <p className="text-muted-foreground mt-0.5">Plan een afspraak in en koppel deze optioneel aan een lead</p>
        </div>
      </div>

      {/* Lead koppelen */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> Lead koppelen
          </CardTitle>
          <p className="text-xs text-muted-foreground">Optioneel — koppel deze afspraak aan een bestaande lead of maak een nieuwe aan</p>
        </CardHeader>
        <CardContent>
          <LeadSearchInput
            selectedLead={selectedLead}
            onSelectLead={handleSelectLead}
            onClearLead={() => setSelectedLead(null)}
          />
        </CardContent>
      </Card>

      {/* Afspraak details */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" /> Afspraakgegevens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Titel *</Label>
            <Input
              value={form.titel}
              onChange={e => update("titel", e.target.value)}
              placeholder="Bijv. Adviesgesprek zonnepanelen"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Adviseur</Label>
              <Select value={form.adviseur_id} onValueChange={v => update("adviseur_id", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer adviseur" />
                </SelectTrigger>
                <SelectContent>
                  {teamUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {u.voornaam} {u.achternaam}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thuisbezoek">
                    <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Thuisbezoek</span>
                  </SelectItem>
                  <SelectItem value="op_afstand">
                    <span className="flex items-center gap-2"><Video className="h-3.5 w-3.5" /> Op afstand</span>
                  </SelectItem>
                  <SelectItem value="belafspraak">
                    <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Belafspraak</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Datum *</Label>
              <Input type="date" value={form.datum} onChange={e => update("datum", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Starttijd</Label>
              <Input type="time" value={form.start_tijd} onChange={e => update("start_tijd", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Eindtijd</Label>
              <Input type="time" value={form.eind_tijd} onChange={e => update("eind_tijd", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1">{typeIcons[form.type]} Locatie</Label>
            <Input
              value={form.locatie}
              onChange={e => update("locatie", e.target.value)}
              placeholder={form.type === "thuisbezoek" ? "Adres van de klant" : form.type === "op_afstand" ? "Videocall link" : "Telefoonnummer"}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Notities</Label>
            <Textarea
              value={form.notities}
              onChange={e => update("notities", e.target.value)}
              rows={3}
              placeholder="Eventuele notities of aandachtspunten..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/planning")}>Annuleren</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Opslaan..." : "Afspraak inplannen"}
        </Button>
      </div>
    </div>
  );
};

export default AfspraakNieuw;
