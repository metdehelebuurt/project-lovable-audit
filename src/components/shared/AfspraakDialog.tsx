import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon, Video, MapPin, Phone } from "lucide-react";

interface AfspraakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  klantId?: string;
  defaultTitle?: string;
  onSuccess?: () => void;
}

export function AfspraakDialog({ open, onOpenChange, leadId, klantId, defaultTitle, onSuccess }: AfspraakDialogProps) {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titel: defaultTitle || "",
    type: "thuisbezoek",
    datum: "",
    start_tijd: "",
    eind_tijd: "",
    locatie: "",
    notities: "",
  });

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
    const { error } = await supabase.from("afspraken" as any).insert({
      partner_id: profile.partner_id,
      adviseur_id: profile.id,
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
    } as any);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Afspraak ingepland");
    setForm({ titel: "", type: "thuisbezoek", datum: "", start_tijd: "", eind_tijd: "", locatie: "", notities: "" });
    onOpenChange(false);
    onSuccess?.();
  };

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
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Datum *</Label>
              <Input type="date" value={form.datum} onChange={e => update("datum", e.target.value)} />
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
