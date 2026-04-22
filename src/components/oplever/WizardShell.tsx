import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

interface Step {
  key: string;
  label: string;
  content: ReactNode;
  icon?: LucideIcon;
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
  const StepIcon = step.icon;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
            {StepIcon ? <StepIcon className="h-4 w-4 text-primary shrink-0" /> : null}
            <span className="text-foreground font-medium truncate">{step.label}</span>
          </div>
          {rightSlot}
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = i === currentIndex;
            const done = i < currentIndex;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onChange(i)}
                className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : done
                      ? "bg-muted text-foreground border-border"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>
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
