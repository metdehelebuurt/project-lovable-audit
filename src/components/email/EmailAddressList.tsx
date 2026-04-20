import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Mail } from "lucide-react";

interface Props {
  primary: string;
  onPrimaryChange: (val: string) => void;
  extras: string[];
  onExtrasChange: (vals: string[]) => void;
}

export default function EmailAddressList({ primary, onPrimaryChange, extras, onExtrasChange }: Props) {
  const [newAddr, setNewAddr] = useState("");

  const addExtra = () => {
    const v = newAddr.trim();
    if (!v) return;
    if (v === primary || extras.includes(v)) return;
    onExtrasChange([...extras, v]);
    setNewAddr("");
  };

  const removeExtra = (idx: number) => {
    onExtrasChange(extras.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">E-mail (primair)</Label>
        <Input
          type="email"
          value={primary}
          onChange={(e) => onPrimaryChange(e.target.value)}
          placeholder="naam@voorbeeld.nl"
          className="rounded-xl"
        />
      </div>

      {extras.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Extra e-mailadressen</Label>
          {extras.map((addr, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{addr}</span>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 rounded-lg"
                onClick={() => removeExtra(i)}
                aria-label="Verwijderen"
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          type="email"
          value={newAddr}
          onChange={(e) => setNewAddr(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtra(); } }}
          placeholder="Extra e-mailadres toevoegen…"
          className="rounded-xl"
        />
        <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0" onClick={addExtra} aria-label="Toevoegen">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}