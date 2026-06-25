import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { useEffectieveModules } from "@/lib/modules";
import { getAllRoles } from "@/lib/permissions";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  moduleKey?: string;
}

const ProtectedRoute = ({ children, allowedRoles, moduleKey }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const { moduleSet, isLoading: modsLoading } = useEffectieveModules();

  if (loading || (moduleKey && modsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = getAllRoles(profile);
  if (allowedRoles && !allowedRoles.some((r) => userRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }

  // Module-cascade: superadmin bypassed (al via moduleSet); anders moet de module-key in de set zitten
  if (moduleKey && profile.rol !== "superadmin" && !moduleSet.has(moduleKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
