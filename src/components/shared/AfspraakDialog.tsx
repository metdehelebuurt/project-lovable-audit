import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Video, MapPin, Phone, User, Mail } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AfspraakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  klantId?: string;
  defaultTitle?: string;
  onSuccess?: () => void;
}

interface TeamUser {
  id: string;
  voornaam: string;
  achternaam: string;
  rol: string;
}

export function AfspraakDialog({ open, onOpenChange, leadId, klantId, defaultTitle, onSuccess }: AfspraakDialogProps) {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [form, setForm] = useState({
    titel: defaultTitle || "",
    type: "thuisbezoek",
    datum: "",
    start_tijd: "",
    eind_tijd: "",
    locatie: "",
    notities: "",
    adviseur_id: profile?.id || "",
  });
  const [bevestigingVersturen, setBevestigingVersturen] = useState(false);
  const [klantEmail, setKlantEmail] = useState<string | null>(null);

  // Fetch team users (adviseurs + staff + admin) for partner
  useEffect(() => {
    if (!open || !profile?.partner_id) return;
    const fetchTeam = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, rol")
        .eq("partner_id", profile.partner_id!)
        .in("rol", ["adviseur", "partner_staff", "partner_admin", "backoffice"])
        .eq("status", "actief");
      if (data) setTeamUsers(data as TeamUser[]);
    };
    fetchTeam();
  }, [open, profile?.partner_id]);

  // If leadId provided, try to default adviseur to lead owner
  useEffect(() => {
    if (!open || !leadId) return;
    const fetchLeadOwner = async () => {
      const { data } = await supabase.from("leads").select("owner_user_id, toegewezen_aan").eq("id", leadId).single();
      if (data) {
        const ownerId = data.toegewezen_aan || data.owner_user_id;
        setForm(prev => ({ ...prev, adviseur_id: ownerId }));
      }
    };
    fetchLeadOwner();
  }, [open, leadId]);

  // Reset title when defaultTitle changes
  useEffect(() => {
    if (defaultTitle) setForm(prev => ({ ...prev, titel: defaultTitle }));
  }, [defaultTitle]);

  // Fetch klant email when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchKlantEmail = async () => {
      if (klantId) {
        const { data } = await supabase.from("klanten").select("email").eq("id", klantId).maybeSingle();
        if (data?.email) setKlantEmail(data.email);
      } else if (leadId) {
        const { data } = await supabase.from("leads").select("email").eq("id", leadId).maybeSingle();
        if (data?.email) setKlantEmail(data.email);
      } else {
        setKlantEmail(null);
      }
    };
    fetchKlantEmail();
  }, [open, klantId, leadId]);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.titel || !form.datum) {
      toast.error("Titel en datum zijn verplicht");
      return;
    }
    if (!profile?.partner_id) {
      toast.error("Geen partner gekoppeld");
      return;
    }
    setSaving(true);
    const adviseurId = form.adviseur_id || profile.id;
    const { data: inserted, error } = await supabase.from("afspraken" as any).insert({
      partner_id: profile.partner_id,
      adviseur_id: adviseurId,
      lead_id: leadId || null,
      klant_id: klantId || null,
      titel: form.titel,
      type: form.type,
      datum: form.datum,
      start_tijd: form.start_tijd || null,
      eind_tijd: form.eind_tijd || null,
      locatie: form.locatie || null,
      notities: form.notities || null,
      status: "gepland",
    } as any).select("id").single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    // E-mail naar adviseur (alleen als hij/zij niet zelf de inplanner is)
    try {
      if (adviseurId && adviseurId !== profile.id) {
        const { data: adviseur } = await supabase.from("users")
          .select("email, voornaam").eq("id", adviseurId).maybeSingle();
        if (adviseur?.email) {
          const ingeplandDoor = [profile.voornaam, profile.achternaam].filter(Boolean).join(" ") || undefined;
          const klantNaam = await resolveKlantNaam(leadId, klantId);
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "afspraak-ingepland",
              recipientEmail: adviseur.email,
              idempotencyKey: `afspraak-ingepland-${(inserted as any)?.id}`,
              templateData: {
                titel: form.titel,
                type: form.type,
                datum: new Date(form.datum).toLocaleDateString("nl-NL"),
                tijd: form.start_tijd ? form.start_tijd.slice(0, 5) : undefined,
                locatie: form.locatie || undefined,
                klantNaam,
                notities: form.notities || undefined,
                ingeplandDoor,
              },
            },
          });
        }
      }
    } catch (e) {
      console.warn("afspraak-ingepland mail kon niet worden verzonden", e);
    }

    toast.success("Afspraak ingepland");
    setForm({ titel: "", type: "thuisbezoek", datum: "", start_tijd: "", eind_tijd: "", locatie: "", notities: "", adviseur_id: profile?.id || "" });
    onOpenChange(false);
    onSuccess?.();
  };

  async function resolveKlantNaam(leadId?: string, klantId?: string): Promise<string | undefined> {
    if (klantId) {
      const { data } = await supabase.from("klanten").select("voornaam, achternaam").eq("id", klantId).maybeSingle();
      return [data?.voornaam, data?.achternaam].filter(Boolean).join(" ") || undefined;
    }
    if (leadId) {
      const { data } = await supabase.from("leads").select("voornaam, achternaam").eq("id", leadId).maybeSingle();
      return [data?.voornaam, data?.achternaam].filter(Boolean).join(" ") || undefined;
    }
    return undefined;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Afspraak inplannen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titel *</Label>
            <Input value={form.titel} onChange={e => update("titel", e.target.value)} placeholder="Bijv. Adviesgesprek zonnepanelen" />
          </div>
          <div>
            <Label>Adviseur</Label>
            <Select value={form.adviseur_id} onValueChange={v => update("adviseur_id", v)}>
              <SelectTrigger>
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
              <SelectTrigger>
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Datum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.datum && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.datum ? format(new Date(form.datum + "T00:00:00"), "d MMMM yyyy", { locale: nl }) : <span>Kies een datum</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.datum ? new Date(form.datum + "T00:00:00") : undefined}
                    onSelect={(date) => update("datum", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Van</Label>
              <Input type="time" value={form.start_tijd} onChange={e => update("start_tijd", e.target.value)} />
            </div>
            <div>
              <Label>Tot</Label>
              <Input type="time" value={form.eind_tijd} onChange={e => update("eind_tijd", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Locatie</Label>
            <Input value={form.locatie} onChange={e => update("locatie", e.target.value)} placeholder="Adres of videocall link" />
          </div>
          <div>
            <Label>Notities</Label>
            <Textarea value={form.notities} onChange={e => update("notities", e.target.value)} rows={3} placeholder="Eventuele notities..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Inplannen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
