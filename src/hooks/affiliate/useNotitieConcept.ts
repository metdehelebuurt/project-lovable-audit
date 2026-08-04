import { useCallback, useEffect, useState } from "react";

const PREFIX = "belsessie-notitie:";

/**
 * Houdt de gespreksnotitie per lead vast in localStorage, zodat getypte tekst
 * niet verloren gaat bij verversen, wisselen van lead of een mislukte opslag.
 */
export function useNotitieConcept(leadId: string | undefined) {
  const key = leadId ? `${PREFIX}${leadId}` : null;
  const [notitie, setNotitieState] = useState("");

  useEffect(() => {
    if (!key) {
      setNotitieState("");
      return;
    }
    try {
      setNotitieState(window.localStorage.getItem(key) ?? "");
    } catch {
      setNotitieState("");
    }
  }, [key]);

  const setNotitie = useCallback(
    (waarde: string) => {
      setNotitieState(waarde);
      if (!key) return;
      try {
        if (waarde.trim()) window.localStorage.setItem(key, waarde);
        else window.localStorage.removeItem(key);
      } catch {
        /* storage niet beschikbaar — notitie blijft in state staan */
      }
    },
    [key],
  );

  const wisConcept = useCallback(() => {
    setNotitieState("");
    if (!key) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* niets te doen */
    }
  }, [key]);

  return { notitie, setNotitie, wisConcept, heeftConcept: notitie.trim().length > 0 };
}
