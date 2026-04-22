import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Opleverrapport, ScopeNormen } from "./types";

interface Props {
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

const NORMEN: { key: keyof ScopeNormen; label: string }[] = [
  { key: "nen1010", label: "Beoordeeld conform NEN 1010 (laagspanningsinstallaties)" },
  { key: "nen3140", label: "Beoordeeld conform NEN 3140 (bedrijfsvoering elektrische installaties)" },
  { key: "fabrikant", label: "Volgens fabrikantrichtlijnen geïnstalleerd" },
  { key: "netbeheerder", label: "Voldoet aan eisen netbeheerder" },
];

export default function StepNormenScope({ draft, onChange }: Props) {
  const extra = draft.extra_velden ?? {};
  const scope = extra.scope_normen ?? {};

  const toggleNorm = (k: keyof ScopeNormen, v: boolean) =>
    onChange({ extra_velden: { ...extra, scope_normen: { ...scope, [k]: v } } });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">Beoordelingskader</h3>
          <p className="text-sm text-muted-foreground">Vink aan welke normen en richtlijnen zijn toegepast bij deze oplevering.</p>
        </div>
        <div className="space-y-2">
          {NORMEN.map((n) => (
            <label key={n.key} className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer">
              <Checkbox
                checked={Boolean(scope[n.key])}
                onCheckedChange={(v) => toggleNorm(n.key, Boolean(v))}
              />
              <span className="text-sm">{n.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>Installatie heeft backup / noodstroom</span>
          <Switch
            checked={Boolean(extra.heeft_backup)}
            onCheckedChange={(v) => onChange({ extra_velden: { ...extra, heeft_backup: v } })}
          />
        </Label>
        <p className="text-xs text-muted-foreground">
          Als dit aanstaat, verschijnt er een extra stap voor de noodstroom-controle.
        </p>
      </section>
    </div>
  );
}