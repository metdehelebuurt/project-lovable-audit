import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  PRODUCT_ROL_LABELS,
  type ProductRol,
  type SlotType,
} from "@/lib/assemblage/typeTemplates";
import type { AssemblageSlot } from "@/hooks/producten/useAssemblageSlots";

interface Props {
  slot: AssemblageSlot;
  onChange: (patch: Partial<AssemblageSlot>) => void;
  onDelete: () => void;
}

const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  single_select: "Enkelvoudige keuze",
  multi_select: "Meervoudige keuze",
  quantity_step: "Aantal-stap (modules)",
};

export default function SlotRow({ slot, onChange, onDelete }: Props) {
  const [specFilterText, setSpecFilterText] = useState(
    slot.spec_filter ? JSON.stringify(slot.spec_filter) : "",
  );

  const handleSpecBlur = () => {
    const raw = specFilterText.trim();
    if (!raw) return onChange({ spec_filter: null });
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      onChange({ spec_filter: parsed });
    } catch {
      // ongeldig — laat oude waarde staan
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3 bg-background">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 grid gap-3 md:grid-cols-2">
          <div>
            <Label>Label</Label>
            <Input value={slot.label} onChange={(e) => onChange({ label: e.target.value })} />
          </div>
          <div>
            <Label>Sleutel (API-naam)</Label>
            <Input
              value={slot.sleutel}
              onChange={(e) => onChange({ sleutel: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
            />
          </div>
          <div>
            <Label>Type keuze</Label>
            <Select value={slot.slot_type} onValueChange={(v) => onChange({ slot_type: v as SlotType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SLOT_TYPE_LABELS) as SlotType[]).map((k) => (
                  <SelectItem key={k} value={k}>{SLOT_TYPE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rol-filter</Label>
            <Select
              value={slot.product_rol_filter ?? "__any__"}
              onValueChange={(v) => onChange({ product_rol_filter: v === "__any__" ? null : (v as ProductRol) })}
            >
              <SelectTrigger><SelectValue placeholder="Kies rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">— Geen filter —</SelectItem>
                {(Object.keys(PRODUCT_ROL_LABELS) as ProductRol[]).map((r) => (
                  <SelectItem key={r} value={r}>{PRODUCT_ROL_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Min</Label>
              <Input type="number" min={0} value={slot.min_aantal}
                onChange={(e) => onChange({ min_aantal: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Max</Label>
              <Input type="number" min={1} value={slot.max_aantal}
                onChange={(e) => onChange({ max_aantal: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <Label>Default</Label>
              <Input type="number" min={0} value={slot.default_aantal}
                onChange={(e) => onChange({ default_aantal: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={slot.verplicht} onCheckedChange={(v) => onChange({ verplicht: v })} />
              <Label>Verplicht</Label>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Spec-filter (JSON, ondersteunt {"{{template.<attr>}}"})</Label>
            <Input
              value={specFilterText}
              onChange={(e) => setSpecFilterText(e.target.value)}
              onBlur={handleSpecBlur}
              placeholder={`bv. {"fase":"{{template.fase}}-fase"}`}
              className="font-mono text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Helptekst</Label>
            <Input value={slot.helptekst ?? ""} onChange={(e) => onChange({ helptekst: e.target.value })} />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Slot verwijderen">
          <Trash2 className="h-4 w-4 text-error" />
        </Button>
      </div>
    </div>
  );
}