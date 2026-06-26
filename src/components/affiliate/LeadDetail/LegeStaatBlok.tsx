import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  icon: LucideIcon;
  titel: string;
  subtitel?: string;
  actie?: { label: string; onClick: () => void };
  klein?: boolean;
}

/** Herbruikbare lege-staat met icoon, titel, subtitel en optionele CTA. */
export function LegeStaatBlok({ icon: Icon, titel, subtitel, actie, klein }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center rounded-lg border border-dashed bg-muted/20 ${klein ? "px-4 py-6" : "px-6 py-10"}`}>
      <div className="rounded-full bg-muted/60 p-3 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{titel}</p>
      {subtitel && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{subtitel}</p>}
      {actie && (
        <Button size="sm" variant="outline" className="mt-3" onClick={actie.onClick}>
          {actie.label}
        </Button>
      )}
    </div>
  );
}