import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlanLimits {
  max_leads: number | null;
  max_offertes: number | null;
  max_gebruikers: number | null;
  max_adviseurs: number | null;
  max_installateurs: number | null;
  modules: string[];
  features: string[];
}

interface SubscriptionInfo {
  plan_naam: string;
  plan_slug: string;
  status: string;
  interval: string;
  verloop_datum: string | null;
  opzeg_datum: string | null;
  limits: PlanLimits;
  loading: boolean;
}

const DEFAULT_LIMITS: PlanLimits = {
  max_leads: null, max_offertes: null, max_gebruikers: null,
  max_adviseurs: null, max_installateurs: null,
  modules: [], features: [],
};

export function useSubscriptionLimits(): SubscriptionInfo & {
  canAccess: (module: string) => boolean;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (type: string, count: number) => boolean;
  getPlanLimits: () => PlanLimits;
} {
  const { profile } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>({
    plan_naam: "", plan_slug: "", status: "", interval: "",
    verloop_datum: null, opzeg_datum: null, limits: DEFAULT_LIMITS, loading: true,
  });

  const [addonExtras, setAddonExtras] = useState<{ adviseurs: number; installateurs: number }>({ adviseurs: 0, installateurs: 0 });

  useEffect(() => {
    if (!profile?.partner_id) {
      setInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchData = async () => {
      const [{ data: abo }, { data: addonAankopen }] = await Promise.all([
        supabase
          .from("abonnementen")
          .select("*, abonnement_plannen(*)")
          .eq("partner_id", profile.partner_id!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("abonnement_addon_aankopen")
          .select("aantal, abonnement_addons(type)")
          .eq("partner_id", profile.partner_id!)
          .eq("status", "actief"),
      ]);

      // Calculate addon extras
      let extraAdviseurs = 0;
      let extraInstallateurs = 0;
      if (addonAankopen) {
        for (const a of addonAankopen) {
          const type = (a as any).abonnement_addons?.type;
          if (type === "adviseur") extraAdviseurs += a.aantal;
          if (type === "installateur") extraInstallateurs += a.aantal;
        }
      }
      setAddonExtras({ adviseurs: extraAdviseurs, installateurs: extraInstallateurs });

      if (!abo) {
        setInfo(prev => ({ ...prev, loading: false, status: "geen" }));
        return;
      }

      const plan = (abo as any).abonnement_plannen;
      const modules = Array.isArray(plan?.modules) ? plan.modules as string[] : [];
      const features = Array.isArray(plan?.features) ? plan.features as string[] : [];

      setInfo({
        plan_naam: plan?.naam ?? abo.plan ?? "",
        plan_slug: plan?.slug ?? "",
        status: abo.status,
        interval: (abo as any).interval ?? "maandelijks",
        verloop_datum: abo.verloop_datum,
        opzeg_datum: (abo as any).opzeg_datum,
        limits: {
          max_leads: plan?.max_leads ?? null,
          max_offertes: plan?.max_offertes ?? null,
          max_gebruikers: plan?.max_gebruikers ?? null,
          max_adviseurs: plan?.max_adviseurs ?? null,
          max_installateurs: plan?.max_installateurs ?? null,
          modules,
          features,
        },
        loading: false,
      });
    };

    fetchData();
  }, [profile?.partner_id]);

  // Superadmin bypasses all limits
  const isSuperadmin = profile?.rol === "superadmin";

  const canAccess = (module: string) => {
    if (isSuperadmin) return true;
    if (info.limits.modules.length === 0) return true; // no restrictions
    return info.limits.modules.includes(module);
  };

  const hasFeature = (feature: string) => {
    if (isSuperadmin) return true;
    if (info.limits.features.length === 0) return true;
    return info.limits.features.includes(feature);
  };

  const isWithinLimit = (type: string, count: number) => {
    if (isSuperadmin) return true;
    const key = `max_${type}` as keyof PlanLimits;
    const limit = info.limits[key];
    if (limit === null || limit === undefined) return true; // unlimited
    // Add addon extras for adviseurs and installateurs
    let effectiveLimit = limit as number;
    if (type === "adviseurs") effectiveLimit += addonExtras.adviseurs;
    if (type === "installateurs") effectiveLimit += addonExtras.installateurs;
    return count < effectiveLimit;
  };

  const getPlanLimits = () => info.limits;

  return { ...info, canAccess, hasFeature, isWithinLimit, getPlanLimits };
}
