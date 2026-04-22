import { useEffect, useRef } from "react";
import { patchRapport, fetchRapport } from "./api/opleverApi";
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
        // Merge extra_velden with the latest server state to prevent partial JSONB overwrites
        let toPatch: Partial<Opleverrapport> = draft;
        if (draft.extra_velden) {
          try {
            const fresh = await fetchRapport(id);
            toPatch = {
              ...draft,
              extra_velden: { ...(fresh.extra_velden ?? {}), ...draft.extra_velden },
            };
          } catch {
            // fall back to plain patch
          }
        }
        await patchRapport(id, toPatch);
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