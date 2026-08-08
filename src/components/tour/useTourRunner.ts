import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TourPlan, TourStep } from "@/lib/tour/types";

export interface TourRunner {
  plan: TourPlan | null;
  index: number;
  step: TourStep | null;
  start: (plan: TourPlan) => void;
  volgende: () => void;
  vorige: () => void;
  stop: () => void;
}

/** Houdt de voortgang van een tutorial bij en navigeert naar de route van elke stap. */
export function useTourRunner(): TourRunner {
  const [plan, setPlan] = useState<TourPlan | null>(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const step = plan?.stappen[index] ?? null;

  const stop = useCallback(() => {
    setPlan(null);
    setIndex(0);
  }, []);

  const start = useCallback((nieuw: TourPlan) => {
    if (nieuw.stappen.length === 0) return;
    setPlan(nieuw);
    setIndex(0);
  }, []);

  const volgende = useCallback(() => {
    setIndex((i) => {
      const laatste = (plan?.stappen.length ?? 0) - 1;
      if (i >= laatste) {
        setPlan(null);
        return 0;
      }
      return i + 1;
    });
  }, [plan]);

  const vorige = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Navigeer naar de route van de huidige stap wanneer we er nog niet zijn.
  useEffect(() => {
    if (!step?.route || step.route === "*") return;
    if (location.pathname === step.route) return;
    navigate(step.route);
  }, [step?.route, step?.id, location.pathname, navigate]);

  // Esc stopt de tutorial.
  useEffect(() => {
    if (!plan) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stop(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plan, stop]);

  return { plan, index, step, start, volgende, vorige, stop };
}
