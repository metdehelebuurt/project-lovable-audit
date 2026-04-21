import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FEATURES_BY_GROEP } from "@/lib/abonnementFeatures";
import { Search } from "lucide-react";

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function FeatureSelector({ selected, onChange }: Props) {
  const [zoek, setZoek] = useState("");
  const groepen = Object.entries(FEATURES_BY_GROEP);

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const selectGroep = (feats: { key: string }[]) => {
    const keys = feats.map((f) => f.key);
    const allChecked = keys.every((k) => selected.includes(k));
    onChange(allChecked ? selected.filter((k) => !keys.includes(k)) : Array.from(new Set([...selected, ...keys])));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Features ({selected.length})</Label>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Zoek feature..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="h-8 pl-7 text-sm"
          />
        </div>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border rounded-lg p-3">
        {groepen.map(([groep, feats]) => {
          const filtered = feats.filter((f) =>
            f.label.toLowerCase().includes(zoek.toLowerCase()) || f.key.includes(zoek.toLowerCase())
          );
          if (filtered.length === 0) return null;
          return (
            <div key={groep} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{groep}</p>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => selectGroep(filtered)}>
                  Alles
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selected.includes(f.key)} onCheckedChange={() => toggle(f.key)} />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
