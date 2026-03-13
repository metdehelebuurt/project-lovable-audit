import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export type WidgetFormData = {
  type: string;
  naam: string;
  config: {
    intro_tekst?: string;
    cta_tekst?: string;
    toon_telefoon?: boolean;
    toon_bericht?: boolean;
  };
  actief: boolean;
};

interface WidgetConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: WidgetFormData) => Promise<void>;
  initialData?: WidgetFormData;
  isEditing?: boolean;
}

const widgetTypeLabels: Record<string, string> = {
  contactformulier: "Contactformulier",
  calculator_zonnepanelen: "Calculator — Zonnepanelen",
  calculator_warmtepomp: "Calculator — Warmtepomp",
  calculator_isolatie: "Calculator — Isolatie",
  calculator_laadpaal: "Calculator — Laadpaal",
};

export const WidgetConfigurator = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEditing,
}: WidgetConfiguratorProps) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WidgetFormData>(
    initialData || {
      type: "contactformulier",
      naam: "",
      config: {
        intro_tekst: "",
        cta_tekst: "Verstuur aanvraag",
        toon_telefoon: true,
        toon_bericht: true,
      },
      actief: true,
    }
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Widget bewerken" : "Nieuwe widget aanmaken"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>Type widget</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(widgetTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Naam (intern)</Label>
            <Input
              value={form.naam}
              onChange={(e) => setForm({ ...form, naam: e.target.value })}
              placeholder="bijv. Homepage contactformulier"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Intro tekst</Label>
            <Textarea
              value={form.config.intro_tekst || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, intro_tekst: e.target.value } })}
              placeholder="Neem contact met ons op..."
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>CTA button tekst</Label>
            <Input
              value={form.config.cta_tekst || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, cta_tekst: e.target.value } })}
              maxLength={50}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Actief</Label>
            <Switch checked={form.actief} onCheckedChange={(v) => setForm({ ...form, actief: v })} />
          </div>

          <Button onClick={handleSave} disabled={saving || !form.naam.trim()} className="w-full rounded-[40px]">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? "Opslaan" : "Aanmaken"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
