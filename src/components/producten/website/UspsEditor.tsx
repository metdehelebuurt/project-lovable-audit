import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Props {
  usps: string[];
  onChange: (usps: string[]) => void;
}

export default function UspsEditor({ usps, onChange }: Props) {
  const update = (i: number, val: string) => {
    const next = [...usps];
    next[i] = val;
    onChange(next);
  };
  const add = () => onChange([...usps, ""]);
  const remove = (i: number) => onChange(usps.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {usps.map((u, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={u}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`USP ${i + 1}`}
            maxLength={120}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Verwijder USP">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {usps.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="rounded-[40px] gap-1.5">
          <Plus className="h-3.5 w-3.5" /> USP toevoegen
        </Button>
      )}
    </div>
  );
}