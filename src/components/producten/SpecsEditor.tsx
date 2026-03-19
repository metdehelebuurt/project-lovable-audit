import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { getGroupedSpecs, categorySpecDefinitions, type SpecDefinition } from "./categorySpecDefinitions";

interface SpecsEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
  categorie?: string;
}

export default function SpecsEditor({ specs, onChange, categorie }: SpecsEditorProps) {
  const grouped = categorie ? getGroupedSpecs(categorie) : {};
  const definedKeys = new Set(
    categorie ? (categorySpecDefinitions[categorie] || []).map(d => d.key) : []
  );

  // Custom specs = keys not in definitions
  const customSpecs = Object.entries(specs).filter(([k]) => !definedKeys.has(k));

  const updateSpec = (key: string, value: string) => {
    onChange({ ...specs, [key]: value });
  };

  const removeSpec = (key: string) => {
    const { [key]: _, ...rest } = specs;
    onChange(rest);
  };

  const addCustomSpec = () => {
    onChange({ ...specs, "": "" });
  };

  const updateCustomKey = (oldKey: string, newKey: string, idx: number) => {
    const customEntries = customSpecs;
    const newSpecs = { ...specs };
    // Remove old key
    delete newSpecs[oldKey];
    // Re-insert with new key at same position
    newSpecs[newKey] = customEntries[idx]?.[1] ?? "";
    onChange(newSpecs);
  };

  const renderField = (def: SpecDefinition) => {
    const value = specs[def.key] || "";

    if (def.type === "boolean") {
      return (
        <div key={def.key} className="flex items-center justify-between py-1.5">
          <Label className="text-sm text-foreground">{def.label}</Label>
          <Switch
            checked={value === "Ja" || value === "true"}
            onCheckedChange={(checked) => updateSpec(def.key, checked ? "Ja" : "Nee")}
          />
        </div>
      );
    }

    if (def.type === "select" && def.options) {
      return (
        <div key={def.key} className="space-y-1">
          <Label className="text-xs text-muted-foreground">{def.label}</Label>
          <Select value={value} onValueChange={(v) => updateSpec(def.key, v)}>
            <SelectTrigger className="rounded-xl h-9">
              <SelectValue placeholder={`Selecteer ${def.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {def.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={def.key} className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          {def.label}{def.unit ? ` (${def.unit})` : ""}
        </Label>
        <Input
          type={def.type === "number" ? "number" : "text"}
          placeholder={def.unit ? `bijv. 25 ${def.unit}` : `${def.label}...`}
          value={value}
          onChange={(e) => updateSpec(def.key, e.target.value)}
          className="rounded-xl h-9"
        />
      </div>
    );
  };

  // Count filled specs per group
  const getGroupFillCount = (defs: SpecDefinition[]) => {
    const filled = defs.filter(d => specs[d.key] && specs[d.key].trim() !== "").length;
    return `${filled}/${defs.length}`;
  };

  if (!categorie || Object.keys(grouped).length === 0) {
    // Fallback: free-form editor (no category selected)
    return (
      <FreeFormEditor
        specs={specs}
        onChange={onChange}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Specificaties
        </h3>
      </div>

      <Accordion type="multiple" className="space-y-1">
        {Object.entries(grouped).map(([group, defs]) => (
          <AccordionItem key={group} value={group} className="border rounded-xl px-3">
            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
              <span className="flex items-center gap-2">
                {group}
                <span className="text-xs font-normal text-muted-foreground">
                  {getGroupFillCount(defs)}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {defs.map(renderField)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Custom specs section */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Extra specificaties
          </h4>
          <Button type="button" variant="ghost" size="sm" onClick={addCustomSpec} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Toevoegen
          </Button>
        </div>
        {customSpecs.length === 0 && (
          <p className="text-xs text-muted-foreground">Geen extra specificaties.</p>
        )}
        <div className="space-y-2">
          {customSpecs.map(([key, value], i) => (
            <div key={`custom-${i}`} className="flex items-center gap-2">
              <Input
                placeholder="Naam"
                value={key}
                onChange={(e) => updateCustomKey(key, e.target.value, i)}
                className="rounded-xl flex-1 h-9"
              />
              <Input
                placeholder="Waarde"
                value={value}
                onChange={(e) => updateSpec(key, e.target.value)}
                className="rounded-xl flex-1 h-9"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(key)} className="shrink-0 text-destructive h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Fallback free-form editor when no category is selected */
function FreeFormEditor({ specs, onChange }: { specs: Record<string, string>; onChange: (s: Record<string, string>) => void }) {
  const entries = Object.entries(specs);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Specificaties</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...specs, "": "" })} className="gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Toevoegen
        </Button>
      </div>
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">Geen specificaties. Kies eerst een categorie of klik op "Toevoegen".</p>
      )}
      <div className="space-y-2">
        {entries.map(([key, value], i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Naam (bijv. Vermogen)"
              value={key}
              onChange={(e) => {
                const newSpecs: Record<string, string> = {};
                entries.forEach(([k, v], j) => {
                  newSpecs[j === i ? e.target.value : k] = v;
                });
                onChange(newSpecs);
              }}
              className="rounded-xl flex-1"
            />
            <Input
              placeholder="Waarde (bijv. 400Wp)"
              value={value}
              onChange={(e) => onChange({ ...specs, [key]: e.target.value })}
              className="rounded-xl flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => {
              const { [key]: _, ...rest } = specs;
              onChange(rest);
            }} className="shrink-0 text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
