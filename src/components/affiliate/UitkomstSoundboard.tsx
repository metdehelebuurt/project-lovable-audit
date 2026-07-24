import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

type Accent = "muted" | "rose" | "blue" | "violet" | "emerald" | "amber";

const accentClass: Record<Accent, string> = {
  muted: "hover:bg-muted",
  rose: "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300",
  blue: "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
  violet: "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300",
  emerald: "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300",
  amber: "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300",
};

export function UitkomstGroep({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">{titel}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function UitkomstKnop({
  icon: Icon,
  label,
  hint,
  accent = "muted",
  onClick,
  disabled,
}: {
  icon: LucideIcon | ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  accent?: Accent;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className={`w-full justify-start h-auto py-2.5 px-3 text-sm font-medium transition-colors ${accentClass[accent]} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4 mr-2.5 shrink-0" />
      <span className="flex-1 text-left">
        <span className="block leading-tight">{label}</span>
        {hint && <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">{hint}</span>}
      </span>
    </Button>
  );
}
