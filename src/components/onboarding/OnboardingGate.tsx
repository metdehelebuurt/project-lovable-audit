import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redirect ingelogde gebruikers naar /onboarding zolang de wizard
 * niet voltooid of overgeslagen is. Rollen 'consument' en 'affiliate'
 * worden niet geforceerd (eigen portalen).
 */
const SKIP_ROLES = new Set(["consument", "affiliate"]);
const ALLOWED_WHILE_PENDING = ["/onboarding", "/welkom", "/profiel", "/instellingen", "/login", "/reset-password"];

/** Heeft de partner van deze gebruiker een lopende proefperiode? */
const heeftActieveTrial = async (partnerId: string | null | undefined) => {
  if (!partnerId) return false;
  const { data } = await supabase
    .from("partners")
    .select("trial_einddatum")
    .eq("id", partnerId)
    .maybeSingle();
  const einde = data?.trial_einddatum;
  return !!einde && new Date(`${einde}T23:59:59`).getTime() >= Date.now();
};

export const OnboardingGate = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (loading || !profile) { setChecked(true); return; }
      if (SKIP_ROLES.has(profile.rol)) { setChecked(true); return; }
      if (ALLOWED_WHILE_PENDING.some(p => location.pathname.startsWith(p))) { setChecked(true); return; }

      const { data } = await supabase
        .from("users")
        .select("onboarding_voltooid_op, onboarding_overgeslagen_op")
        .eq("id", profile.id)
        .maybeSingle();
      if (cancelled) return;
      const done = !!(data as any)?.onboarding_voltooid_op || !!(data as any)?.onboarding_overgeslagen_op;
      if (!done) {
        const trial = await heeftActieveTrial(profile.partner_id);
        if (cancelled) return;
        if (trial) {
          await supabase
            .from("users")
            .update({ onboarding_overgeslagen_op: new Date().toISOString() })
            .eq("id", profile.id);
          if (cancelled) return;
          navigate("/welkom", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
      setChecked(true);
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, loading, location.pathname]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  return <Outlet />;
};

export default OnboardingGate;