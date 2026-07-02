import { CalendarClock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quickReschedulePresets } from "./demoTijdHelpers";

interface Props {
  huidigGeplandOp: string;
  onKies: (nieuweTijd: Date) => void;
  onCustom: () => void;
  disabled?: boolean;
}

/**
 * Snelle verplaats-acties voor een demo-afspraak. Bevat vaste presets
 * (relatief aan huidige geplande tijd of aan vandaag) plus een fallback
 * naar de custom "Verzet"-dialog.
 */
export function QuickRescheduleMenu({ huidigGeplandOp, onKies, onCustom, disabled }: Props) {
  const huidig = new Date(huidigGeplandOp);
  const presets = quickReschedulePresets();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          title="Snel verzetten"
        >
          <CalendarClock className="h-3 w-3 mr-1" />
          Verzet
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs">Snelle acties</DropdownMenuLabel>
        {presets.map((p) => {
          const doel = p.compute(huidig);
          return (
            <DropdownMenuItem key={p.label} onSelect={() => onKies(doel)}>
              <span className="flex-1">{p.label}</span>
              <span className="text-[10px] text-muted-foreground ml-2">
                {doel.toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCustom}>Andere datum/tijd…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}