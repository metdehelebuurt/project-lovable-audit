import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  opties: string[];
  geselecteerd: string[];
  onToggle: (waarde: string) => void;
}

export function StijlChips({ label, opties, geselecteerd, onToggle }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {opties.map((opt) => {
          const actief = geselecteerd.includes(opt);
          return (
            <Badge
              key={opt}
              variant={actief ? "default" : "outline"}
              className={cn("cursor-pointer select-none", actief && "bg-primary hover:bg-primary/90")}
              onClick={() => onToggle(opt)}
            >
              {opt}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}