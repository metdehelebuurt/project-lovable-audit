import { useEffect, useRef } from "react";
import { patchRapport } from "./api/opleverApi";
import type { Opleverrapport } from "./types";

const DEBOUNCE_MS = 1500;

export function useOpleverAutosave(id: string | undefined, draft: Partial<Opleverrapport>) {
  const lastSerialized = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const serialized = JSON.stringify(draft);
    if (serialized === lastSerialized.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await patchRapport(id, draft);
        lastSerialized.current = serialized;
      } catch (e) {
        console.warn("Autosave mislukt", e);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id, draft]);
}