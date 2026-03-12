import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface SpecsEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

export default function SpecsEditor({ specs, onChange }: SpecsEditorProps) {
  const entries = Object.entries(specs);

  const addSpec = () => {
    onChange({ ...specs, "": "" });
  };

  const updateKey = (oldKey: string, newKey: string, index: number) => {
    const newSpecs: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      newSpecs[i === index ? newKey : k] = v;
    });
    onChange(newSpecs);
  };

  const updateValue = (key: string, value: string) => {
    onChange({ ...specs, [key]: value });
  };

  const removeSpec = (key: string) => {
    const { [key]: _, ...rest } = specs;
    onChange(rest);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Specificaties</h3>
        <Button type="button" variant="ghost" size="sm" onClick={addSpec} className="gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Toevoegen
        </Button>
      </div>
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">Geen specificaties. Klik op "Toevoegen" om er een toe te voegen.</p>
      )}
      <div className="space-y-2">
        {entries.map(([key, value], i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Naam (bijv. Vermogen)"
              value={key}
              onChange={(e) => updateKey(key, e.target.value, i)}
              className="rounded-xl flex-1"
            />
            <Input
              placeholder="Waarde (bijv. 400Wp)"
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
              className="rounded-xl flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(key)} className="shrink-0 text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
