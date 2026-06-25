import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  seconden: number;
  loopt: boolean;
  onTick: (s: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

function formatTimer(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function GespreksTimer({ seconden, loopt, onTick, onToggle, onReset }: Props) {
  const intRef = useRef<number | null>(null);

  useEffect(() => {
    if (intRef.current) {
      window.clearInterval(intRef.current);
      intRef.current = null;
    }
    if (loopt) {
      intRef.current = window.setInterval(() => onTick(seconden + 1), 1000) as unknown as number;
    }
    return () => {
      if (intRef.current) window.clearInterval(intRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopt, seconden]);

  return (
    <div className="text-right shrink-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gesprekstijd</p>
      <p className="text-2xl font-bold tabular-nums text-primary flex items-center gap-1.5 justify-end">
        <Clock className="h-4 w-4" /> {formatTimer(seconden)}
      </p>
      <div className="flex items-center justify-end gap-1 mt-1">
        <Button size="sm" variant={loopt ? "secondary" : "default"} className="h-7 px-2 text-xs" onClick={onToggle}>
          {loopt ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          {loopt ? "Pauze" : "Start"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onReset} disabled={seconden === 0 && !loopt}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}