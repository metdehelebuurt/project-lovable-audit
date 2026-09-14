import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const BESTEMMING_SLEUTEL = "mh:na-login-pad";

/** Publieke terugkeerpagina na social login. Wacht op de sessie en stuurt door. */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let actief = true;

    const leesBestemming = () => {
      const opgeslagen = sessionStorage.getItem(BESTEMMING_SLEUTEL);
      sessionStorage.removeItem(BESTEMMING_SLEUTEL);
      return opgeslagen && /^\/(?!\/)/.test(opgeslagen) ? opgeslagen : "/dashboard";
    };

    const ga = () => {
      if (!actief) return;
      navigate(leesBestemming(), { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sessie) => {
      if (sessie) ga();
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) ga();
    });

    const timeout = setTimeout(() => {
      if (actief) navigate("/login", { replace: true });
    }, 8000);

    return () => {
      actief = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Bezig met inloggen…
      </p>
    </main>
  );
};

export default AuthCallback;
