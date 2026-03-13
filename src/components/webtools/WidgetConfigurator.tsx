import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  notificatie_email?: string;
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
  calculator_zonnepanelen: "Zonnepanelen Calculator",
  calculator_warmtepomp: "Warmtepomp Calculator",
  calculator_isolatie: "Isolatie Calculator",
  calculator_laadpaal: "Laadpaal Calculator",
  calculator_thuisbatterij: "Thuisbatterij Calculator",
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
      notificatie_email: "",
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

  const isContact = form.type === "contactformulier";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Widget bewerken" : "Widget aanmaken"}</DialogTitle>
          <DialogDescription>
            {widgetTypeLabels[form.type] || form.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <Label>Notificatie e-mail</Label>
            <Input
              type="email"
              value={form.notificatie_email || ""}
              onChange={(e) => setForm({ ...form, notificatie_email: e.target.value })}
              placeholder="optioneel — standaard via systeem notificaties"
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">
              Vul een e-mailadres in als u leads ook per e-mail wilt ontvangen.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Intro tekst</Label>
            <Textarea
              value={form.config.intro_tekst || ""}
              onChange={(e) => setForm({ ...form, config: { ...form.config, intro_tekst: e.target.value } })}
              placeholder={isContact ? "Neem contact met ons op..." : "Bereken uw besparing..."}
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

          {isContact && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Telefoonnummer veld tonen</Label>
                  <p className="text-xs text-muted-foreground">Bezoekers kunnen optioneel een telefoonnummer invullen.</p>
                </div>
                <Switch
                  checked={form.config.toon_telefoon ?? true}
                  onCheckedChange={(v) => setForm({ ...form, config: { ...form.config, toon_telefoon: v } })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Berichtveld tonen</Label>
                  <p className="text-xs text-muted-foreground">Bezoekers kunnen een vrij bericht meesturen.</p>
                </div>
                <Switch
                  checked={form.config.toon_bericht ?? true}
                  onCheckedChange={(v) => setForm({ ...form, config: { ...form.config, toon_bericht: v } })}
                />
              </div>
            </>
          )}

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
