import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  module?: string;
  feature?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ module, feature, children, fallback }: FeatureGateProps) {
  const { canAccess, hasFeature, loading } = useSubscriptionLimits();
  const navigate = useNavigate();

  if (loading) return null;

  const allowed = (!module || canAccess(module)) && (!feature || hasFeature(feature));

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <Card className="rounded-2xl border-dashed border-2 border-muted">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Niet beschikbaar in uw plan</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Deze functie is niet inbegrepen in uw huidige abonnement. Upgrade naar een hoger plan om toegang te krijgen.
        </p>
        <Button onClick={() => navigate("/instellingen")} variant="outline">
          Bekijk beschikbare plannen
        </Button>
      </CardContent>
    </Card>
  );
}
