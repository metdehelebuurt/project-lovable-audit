import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { appsVoorRol, type AppDefinition } from "@/lib/dashboard/apps";
import {
  type AppsLayout,
  LEGE_LAYOUT,
  defaultLayout,
  syncMetBeschikbareApps,
} from "./layoutHelpers";

const LOCAL_KEY_PREFIX = "dashboard_apps_layout:";

function isLayoutObject(val: unknown): val is Partial<AppsLayout> {
  return typeof val === "object" && val !== null;
}

function normaliseer(raw: unknown, beschikbareApps: AppDefinition[]): AppsLayout {
  if (!isLayoutObject(raw) || !Array.isArray(raw.items) || raw.items.length === 0) {
    return defaultLayout(beschikbareApps);
  }
  const layout: AppsLayout = {
    items: raw.items as AppsLayout["items"],
    favorieten: Array.isArray(raw.favorieten) ? raw.favorieten as string[] : [],
    verborgen: Array.isArray(raw.verborgen) ? raw.verborgen as string[] : [],
    widgetsZichtbaar: typeof raw.widgetsZichtbaar === "boolean" ? raw.widgetsZichtbaar : true,
  };
  return syncMetBeschikbareApps(layout, beschikbareApps);
}

export function useAppsLayout() {
  const { profile, user } = useAuth();
  const rol = profile?.rol ?? "consument";
  const beschikbareApps = useMemo(() => appsVoorRol(rol), [rol]);
  const localKey = user ? `${LOCAL_KEY_PREFIX}${user.id}` : null;

  const [layout, setLayoutState] = useState<AppsLayout>(LEGE_LAYOUT);
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Hydrate from profile or localStorage
  useEffect(() => {
    if (!profile) return;
    let initial: AppsLayout;
    const profileLayout = profile.dashboard_apps_layout;
    if (profileLayout && Object.keys(profileLayout).length > 0) {
      initial = normaliseer(profileLayout, beschikbareApps);
    } else if (localKey && typeof window !== "undefined") {
      try {
        const cached = window.localStorage.getItem(localKey);
        initial = cached ? normaliseer(JSON.parse(cached), beschikbareApps) : defaultLayout(beschikbareApps);
      } catch {
        initial = defaultLayout(beschikbareApps);
      }
    } else {
      initial = defaultLayout(beschikbareApps);
    }
    setLayoutState(initial);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, rol]);

  const persistRemote = useCallback((next: AppsLayout) => {
    if (!user) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void supabase
        .from("users")
        .update({ dashboard_apps_layout: next as unknown as Record<string, unknown> })
        .eq("id", user.id);
    }, 500);
  }, [user]);

  const setLayout = useCallback((updater: AppsLayout | ((prev: AppsLayout) => AppsLayout)) => {
    setLayoutState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: AppsLayout) => AppsLayout)(prev) : updater;
      if (localKey && typeof window !== "undefined") {
        try { window.localStorage.setItem(localKey, JSON.stringify(next)); } catch { /* noop */ }
      }
      persistRemote(next);
      return next;
    });
  }, [localKey, persistRemote]);

  return { layout, setLayout, beschikbareApps, hydrated };
}
