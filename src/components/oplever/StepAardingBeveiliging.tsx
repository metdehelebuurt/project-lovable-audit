import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChecklistSection from "./ChecklistSection";
import { AARDING_CHECKLIST } from "./GrenswaardenLogic";
import type { Opleverrapport } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

export default function StepAardingBeveiliging({ draft, onChange }: Props) {
  const extra = draft.extra_velden ?? {};
  const aardR = extra.aardweerstand_ohm;
  const isHoog = typeof aardR === "number" && aardR > 100;

  return (
    <div className="space-y-6">
      <ChecklistSection
        items={extra.aarding_beveiliging}
        preset={AARDING_CHECKLIST}
        intro="Aarding, potentiaalvereffening en beveiligingen."
        onChange={(items) => onChange({ extra_velden: { ...extra, aarding_beveiliging: items } })}
      />
      <section className="rounded-lg border border-border p-3 space-y-2">
        <Label htmlFor="aardweerstand">Gemeten aardweerstand (Ω)</Label>
        <Input
          id="aardweerstand"
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="Bijv. 25"
          value={aardR ?? ""}
          onChange={(e) =>
            onChange({
              extra_velden: {
                ...extra,
                aardweerstand_ohm: e.target.value === "" ? undefined : Number(e.target.value),
              },
            })
          }
        />
        {isHoog ? (
          <p className="text-xs text-destructive">Waarde &gt; 100 Ω — controleer aardingsysteem.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Streefwaarde &lt; 100 Ω voor woninginstallaties.</p>
        )}
      </section>
    </div>
  );
}