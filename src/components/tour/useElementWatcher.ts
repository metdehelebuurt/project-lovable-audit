import { useEffect, useRef, useState } from "react";
import { resolveTarget } from "@/lib/tour/resolveTarget";
import type { TourStep } from "@/lib/tour/types";

export interface Rect { top: number; left: number; width: number; height: number }

const ZOEK_TIMEOUT_MS = 8000;
const POLL_MS = 250;

function meet(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Zoekt het element van een stap (met polling, want schermen laden asynchroon)
 * en houdt de positie bij tijdens scrollen en resizen.
 */
export function useElementWatcher(step: TourStep | null): {
  element: HTMLElement | null;
  rect: Rect | null;
  nietGevonden: boolean;
} {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [nietGevonden, setNietGevonden] = useState(false);
  const stepId = step?.id ?? null;
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    setElement(null);
    setRect(null);
    setNietGevonden(false);
    if (!stepRef.current) return;
    const start = Date.now();
    let gevonden: HTMLElement | null = null;

    const tick = () => {
      const huidig = stepRef.current;
      if (!huidig) return;
      const el = resolveTarget(huidig);
      if (el) {
        gevonden = el;
        setElement(el);
        setRect(meet(el));
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.clearInterval(timer);
      } else if (Date.now() - start > ZOEK_TIMEOUT_MS) {
        setNietGevonden(true);
        window.clearInterval(timer);
      }
    };
    const timer = window.setInterval(tick, POLL_MS);
    tick();
    return () => window.clearInterval(timer);
  }, [stepId]);

  useEffect(() => {
    if (!element) return;
    const update = () => setRect(meet(element));
    const raf = window.setInterval(update, 300);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [element]);

  return { element, rect, nietGevonden };
}
