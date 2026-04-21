import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { TERMIJN_TEMPLATES, TRIGGER_LABELS, saveTermijnschema, type TriggerStatus } from "@/lib/termijnschema";
import { toast } from "sonner";

interface TermijnInput {
  omschrijving: string;
  percentage: number;
  trigger_status: TriggerStatus | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offerteId: string;
  partnerId: string;
  initieel?: TermijnInput[];
  onSaved?: () => void;
}

export default function TermijnschemaWizard({ open, onOpenChange, offerteId, partnerId, initieel, onSaved }: Props) {
  const [termijnen, setTermijnen] = useState<TermijnInput[]>(
    initieel && initieel.length > 0
      ? initieel
      : [{ omschrijving: "Aanbetaling bij opdracht", percentage: 30, trigger_status: "opdracht_bevestigd" }]
  );
  const [saving, setSaving] = useState(false);

  const totaal = termijnen.reduce((s, t) => s + (Number(t.percentage) || 0), 0);
  const klopt = Math.abs(totaal - 100) < 0.01;

  const applyTemplate = (slug: string) => {
    const tpl = TERMIJN_TEMPLATES.find((t) => t.slug === slug);
    if (tpl) setTermijnen(tpl.termijnen.map((t) => ({ ...t })));
  };

  const updateRow = (i: number, patch: Partial<TermijnInput>) => {
    setTermijnen((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () =>
    setTermijnen((rows) => [...rows, { omschrijving: "", percentage: 0, trigger_status: null }]);

  const removeRow = (i: number) => setTermijnen((rows) => rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!klopt) {
      toast.error("Som van percentages moet exact 100% zijn");
      return;
    }
    setSaving(true);
    try {
      await saveTermijnschema(offerteId, partnerId, termijnen);
      toast.success("Termijnschema opgeslagen");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Opslaan mislukt", { description: err?.message });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Termijnschema instellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Snelle templates</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {TERMIJN_TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.slug}
                  className="p-3 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => applyTemplate(tpl.slug)}
                >
                  <div className="font-semibold text-sm">{tpl.naam}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tpl.beschrijving}</div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Termijnen</Label>
              <Button variant="ghost" size="sm" onClick={addRow} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Termijn
              </Button>
            </div>
            <div className="space-y-2">
              {termijnen.map((t, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Omschrijving"
                    value={t.omschrijving}
                    onChange={(e) => updateRow(i, { omschrijving: e.target.value })}
                  />
                  <div className="col-span-2 flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={t.percentage}
                      onChange={(e) => updateRow(i, { percentage: Number(e.target.value) })}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <Select
                    value={t.trigger_status || "_geen"}
                    onValueChange={(v) =>
                      updateRow(i, { trigger_status: v === "_geen" ? null : (v as TriggerStatus) })
                    }
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Trigger (optioneel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_geen">Geen automatische trigger</SelectItem>
                      {Object.entries(TRIGGER_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1"
                    onClick={() => removeRow(i)}
                    disabled={termijnen.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-lg p-3 text-sm ${klopt ? "bg-success-light text-success" : "bg-warning/10 text-warning-foreground"}`}>
            <div className="flex items-center gap-2">
              {!klopt && <AlertTriangle className="h-4 w-4" />}
              <span>Totaal: <strong>{totaal.toFixed(1)}%</strong></span>
            </div>
            {!klopt && <span className="text-xs">Som moet exact 100% zijn</span>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving || !klopt}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
