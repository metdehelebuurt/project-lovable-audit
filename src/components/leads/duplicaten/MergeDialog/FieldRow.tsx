import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Keuze } from "./useMergeForm";

interface Props {
  label: string;
  valueA: unknown;
  valueB: unknown;
  keuze: Keuze;
  onChange: (k: Keuze) => void;
  name: string;
}

function format(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Ja" : "Nee";
  return String(v);
}

export function FieldRow({ label, valueA, valueB, keuze, onChange, name }: Props) {
  const identiek = format(valueA) === format(valueB);
  return (
    <div className="grid grid-cols-[140px_1fr_1fr] items-center gap-3 py-2 border-b last:border-b-0">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
        {label}
        {identiek && <span className="text-[10px] text-muted-foreground/70">(identiek)</span>}
      </div>
      <Option
        name={name}
        side="a"
        active={keuze === "a"}
        identiek={identiek}
        value={format(valueA)}
        onClick={() => onChange("a")}
      />
      <Option
        name={name}
        side="b"
        active={keuze === "b"}
        identiek={identiek}
        value={format(valueB)}
        onClick={() => onChange("b")}
      />
    </div>
  );
}

function Option({ name, side, active, identiek, value, onClick }: { name: string; side: "a" | "b"; active: boolean; identiek: boolean; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "text-left px-3 py-2 rounded-lg border text-sm transition-colors flex items-start gap-2 min-h-[40px]",
        active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-input hover:bg-accent",
        identiek && !active && "opacity-60",
      )}
    >
      <span
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center",
          active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
        )}
        aria-hidden
      >
        {active && <Check className="h-3 w-3" />}
      </span>
      <span className={cn("break-words", value === "—" && "text-muted-foreground italic")}>{value}</span>
      <input type="radio" name={name} className="sr-only" readOnly checked={active} value={side} />
    </button>
  );
}