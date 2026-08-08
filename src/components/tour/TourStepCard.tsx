import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "@/lib/tour/types";
import type { Rect } from "./useElementWatcher";

interface TourStepCardProps {
  step: TourStep;
  index: number;
  totaal: number;
  rect: Rect | null;
  nietGevonden: boolean;
  onVolgende: () => void;
  onVorige: () => void;
  onStop: () => void;
}

const KAART_BREEDTE = 320;

function positie(rect: Rect | null): React.CSSProperties {
  if (!rect || typeof window === "undefined" || window.innerWidth < 768) {
    return { bottom: 16, left: 16, right: 16, width: "auto" };
  }
  const onder = rect.top + rect.height + 12;
  const past = onder + 190 < window.innerHeight;
  const left = Math.min(Math.max(rect.left, 16), window.innerWidth - KAART_BREEDTE - 16);
  return past
    ? { top: onder, left, width: KAART_BREEDTE }
    : { top: Math.max(16, rect.top - 200), left, width: KAART_BREEDTE };
}

export function TourStepCard(props: TourStepCardProps) {
  const { step, index, totaal, rect, nietGevonden, onVolgende, onVorige, onStop } = props;
  const wachtOpKlik = step.wacht === "klik" && !nietGevonden;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={`Tutorialstap ${index + 1} van ${totaal}`}
      className="fixed z-[95] rounded-xl border bg-card p-4 shadow-lg"
      style={positie(rect)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Stap {index + 1} van {totaal}</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onStop} aria-label="Tutorial stoppen">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <h3 className="mt-1 text-sm font-semibold text-foreground">{step.titel}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{step.uitleg}</p>
      {nietGevonden && (
        <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
          Dit element staat niet op het scherm. Zoek het handmatig op en ga daarna verder.
        </p>
      )}
      {wachtOpKlik && (
        <p className="mt-2 text-xs font-medium text-primary">Klik op het gemarkeerde element om verder te gaan.</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onVorige} disabled={index === 0}>Vorige</Button>
        <Button variant={wachtOpKlik ? "outline" : "default"} size="sm" onClick={onVolgende} className="gap-1">
          {wachtOpKlik ? "Overslaan" : "Volgende"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
