import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MetingInput from "./MetingInput";
import type { Meting, MetingType, Opleverrapport } from "./types";
import { GRENSWAARDEN } from "./GrenswaardenLogic";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepMetingen({ draft, onChange }: Props) {
  const metingen = draft.metingen ?? [];
  const apparatuur = draft.meetapparatuur ?? {};

  const addMeting = (type: MetingType) => {
    const m: Meting = { id: crypto.randomUUID(), type, eenheid: GRENSWAARDEN[type].eenheid };
    onChange({ metingen: [...metingen, m] });
  };
  const updateMeting = (idx: number, m: Meting) => {
    const next = [...metingen];
    next[idx] = m;
    onChange({ metingen: next });
  };
  const removeMeting = (idx: number) => {
    onChange({ metingen: metingen.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
        <h3 className="font-semibold">Gebruikte meetapparatuur</h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Serienummer en laatste kalibratiedatum zijn verplicht voor ondertekening.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label>Merk</Label><Input value={apparatuur.merk ?? ""} onChange={(e) => onChange({ meetapparatuur: { ...apparatuur, merk: e.target.value } })} /></div>
          <div><Label>Type</Label><Input value={apparatuur.type ?? ""} onChange={(e) => onChange({ meetapparatuur: { ...apparatuur, type: e.target.value } })} /></div>
          <div>
            <Label>Serienummer <span className="text-destructive">*</span></Label>
            <Input
              required
              aria-required
              value={apparatuur.serienummer ?? ""}
              onChange={(e) => onChange({ meetapparatuur: { ...apparatuur, serienummer: e.target.value } })}
              className={!apparatuur.serienummer?.trim() ? "border-destructive/60" : ""}
            />
          </div>
          <div>
            <Label>Laatste kalibratie <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              required
              aria-required
              value={apparatuur.laatste_kalibratie ?? ""}
              onChange={(e) => onChange({ meetapparatuur: { ...apparatuur, laatste_kalibratie: e.target.value } })}
              className={!apparatuur.laatste_kalibratie ? "border-destructive/60" : ""}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(GRENSWAARDEN) as MetingType[]).map((t) => (
          <Button key={t} type="button" variant="outline" size="sm" onClick={() => addMeting(t)}>
            <Plus className="h-4 w-4" /> {GRENSWAARDEN[t].label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {metingen.map((m, idx) => (
          <div key={m.id} className="flex gap-2 items-start">
            <div className="flex-1"><MetingInput meting={m} onChange={(nm) => updateMeting(idx, nm)} /></div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeMeting(idx)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {metingen.length === 0 && <p className="text-sm text-muted-foreground">Nog geen metingen toegevoegd.</p>}
      </div>
    </div>
  );
}