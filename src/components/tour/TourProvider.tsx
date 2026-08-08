import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { TourPlan } from "@/lib/tour/types";
import { useTourRunner } from "./useTourRunner";
import { useElementWatcher } from "./useElementWatcher";
import { TourSpotlight } from "./TourSpotlight";
import { TourStepCard } from "./TourStepCard";

interface TourContextValue {
  actief: boolean;
  startTour: (plan: TourPlan) => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  actief: false,
  startTour: () => undefined,
  stopTour: () => undefined,
});

export function useTour(): TourContextValue {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const runner = useTourRunner();
  const { step, plan, index, volgende, vorige, stop, start } = runner;
  const { element, rect, nietGevonden } = useElementWatcher(step);

  // Bij een klik-stap: ga verder zodra de gebruiker het element zelf aanklikt.
  useEffect(() => {
    if (!element || step?.wacht !== "klik") return;
    const onClick = () => window.setTimeout(volgende, 350);
    element.addEventListener("click", onClick);
    return () => element.removeEventListener("click", onClick);
  }, [element, step?.wacht, step?.id, volgende]);

  // Bij een invoer-stap: ga verder na een wijziging in het veld.
  useEffect(() => {
    if (!element || step?.wacht !== "invoer") return;
    const onChange = () => window.setTimeout(volgende, 400);
    element.addEventListener("change", onChange);
    return () => element.removeEventListener("change", onChange);
  }, [element, step?.wacht, step?.id, volgende]);

  const value = useMemo<TourContextValue>(
    () => ({ actief: !!plan, startTour: start, stopTour: stop }),
    [plan, start, stop],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {plan && step && (
        <>
          <TourSpotlight rect={rect} />
          <TourStepCard
            step={step}
            index={index}
            totaal={plan.stappen.length}
            rect={rect}
            nietGevonden={nietGevonden}
            onVolgende={volgende}
            onVorige={vorige}
            onStop={stop}
          />
        </>
      )}
    </TourContext.Provider>
  );
}
