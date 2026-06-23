import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TEMPERATUREN, TEMP_LABEL, TEMP_ICON, TEMP_COLOR, type Temperatuur } from "@/lib/sales/temperatuur";

interface Props {
  waarde: Temperatuur | "alle";
  onWijzig: (v: Temperatuur | "alle") => void;
  counts?: Partial<Record<Temperatuur | "alle", number>>;
}

export default function TemperatuurFilter({ waarde, onWijzig, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm"
        variant={waarde === "alle" ? "default" : "outline"}
        onClick={() => onWijzig("alle")}
        className="h-8 px-3"
      >
        Alle{counts?.alle != null && ` · ${counts.alle}`}
      </Button>
      {TEMPERATUREN.map((t) => {
        const Icon = TEMP_ICON[t];
        const actief = waarde === t;
        return (
          <Button
            key={t}
            size="sm"
            variant="outline"
            onClick={() => onWijzig(t)}
            className={cn("h-8 px-3 gap-1.5", actief && TEMP_COLOR[t], actief && "ring-2 ring-offset-1")}
          >
            <Icon className="h-3.5 w-3.5" />
            {TEMP_LABEL[t]}
            {counts?.[t] != null && <span className="text-[11px] opacity-70">· {counts[t]}</span>}
          </Button>
        );
      })}
    </div>
  );
}