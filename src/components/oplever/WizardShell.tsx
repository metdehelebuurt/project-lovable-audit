import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
  key: string;
  label: string;
  content: ReactNode;
}

interface Props {
  steps: Step[];
  currentIndex: number;
  onChange: (index: number) => void;
  rightSlot?: ReactNode;
}

export default function WizardShell({ steps, currentIndex, onChange, rightSlot }: Props) {
  const total = steps.length;
  const pct = Math.round(((currentIndex + 1) / total) * 100);
  const step = steps[currentIndex];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Stap {currentIndex + 1} van {total} — <span className="text-foreground font-medium">{step.label}</span>
          </div>
          {rightSlot}
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="rounded-lg border bg-card p-4 md:p-6">{step.content}</div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => onChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Vorige
        </Button>
        <div className="hidden md:flex flex-wrap gap-1">
          {steps.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(i)}
              className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground border-primary"
                  : i < currentIndex
                    ? "bg-muted text-foreground"
                    : "bg-background text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Button
          onClick={() => onChange(Math.min(total - 1, currentIndex + 1))}
          disabled={currentIndex === total - 1}
        >
          Volgende <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
