import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export interface FaqItem {
  vraag: string;
  antwoord: string;
}

interface Props {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}

export default function FaqEditor({ items, onChange }: Props) {
  const update = (i: number, key: keyof FaqItem, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  const add = () => onChange([...items, { vraag: "", antwoord: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Input
              value={item.vraag}
              onChange={(e) => update(i, "vraag", e.target.value)}
              placeholder="Vraag"
              maxLength={200}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Verwijder FAQ">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={item.antwoord}
            onChange={(e) => update(i, "antwoord", e.target.value)}
            placeholder="Antwoord"
            rows={3}
            maxLength={1000}
          />
        </div>
      ))}
      {items.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="rounded-[40px] gap-1.5">
          <Plus className="h-3.5 w-3.5" /> FAQ toevoegen
        </Button>
      )}
    </div>
  );
}