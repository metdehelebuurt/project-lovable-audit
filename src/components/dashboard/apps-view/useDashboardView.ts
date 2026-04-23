import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DashboardView = "klassiek" | "apps";

const LOCAL_KEY = "dashboard_view";

function readInitial(profileView: DashboardView | undefined): DashboardView {
  if (profileView === "apps" || profileView === "klassiek") return profileView;
  if (typeof window !== "undefined") {
    const cached = window.localStorage.getItem(LOCAL_KEY);
    if (cached === "apps" || cached === "klassiek") return cached;
  }
  return "klassiek";
}

export function useDashboardView() {
  const { profile, user } = useAuth();
  const [view, setView] = useState<DashboardView>(() => readInitial(profile?.dashboard_view));

  useEffect(() => {
    if (profile?.dashboard_view && profile.dashboard_view !== view) {
      setView(profile.dashboard_view);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.dashboard_view]);

  const setAndPersist = useCallback(async (next: DashboardView) => {
    setView(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_KEY, next);
    }
    if (!user) return;
    await supabase.from("users").update({ dashboard_view: next }).eq("id", user.id);
  }, [user]);

  return { view, setView: setAndPersist };
}
