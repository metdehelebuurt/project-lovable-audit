import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface Props {
  waarde: string[];
  onWijzig: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Normaliseer één tag: trim, lowercase, verwijder dubbele spaties. Lege tag → null. */
export function normaliseerTag(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return s.length === 0 ? null : s;
}

/** Vrij invoerveld voor tags. Enter of komma bevestigt, Backspace verwijdert laatste. */
export default function TagsInput({ waarde, onWijzig, placeholder, disabled }: Props) {
  const [invoer, setInvoer] = useState("");

  const voegToe = (raw: string) => {
    const parts = raw
      .split(",")
      .map((t) => normaliseerTag(t))
      .filter((t): t is string => t !== null);
    if (parts.length === 0) return;
    const set = new Set(waarde);
    for (const p of parts) set.add(p);
    onWijzig(Array.from(set));
    setInvoer("");
  };

  const verwijder = (tag: string) => {
    onWijzig(waarde.filter((t) => t !== tag));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (invoer.trim()) voegToe(invoer);
    } else if (e.key === "Backspace" && invoer === "" && waarde.length > 0) {
      verwijder(waarde[waarde.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-1.5 min-h-10">
      {waarde.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
          <span className="text-xs">{t}</span>
          {!disabled && (
            <button
              type="button"
              aria-label={`Tag ${t} verwijderen`}
              onClick={() => verwijder(t)}
              className="rounded-sm hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <Input
        value={invoer}
        onChange={(e) => setInvoer(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => invoer.trim() && voegToe(invoer)}
        placeholder={placeholder ?? "Tag toevoegen…"}
        disabled={disabled}
        className="flex-1 min-w-[140px] h-7 border-0 shadow-none focus-visible:ring-0 px-1 py-0 text-sm"
      />
    </div>
  );
}