import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BlokkadeScherm from "@/components/administratie/BlokkadeScherm";
import { usePartnerBlokkadeStatus } from "@/hooks/administratie/usePartnerBlokkadeStatus";

/** Toont een blokkadescherm in plaats van de applicatie zodra de organisatie geblokkeerd is. */
export function BlokkadeGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { status, isGeblokkeerd, isLoading } = usePartnerBlokkadeStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isGeblokkeerd) return <>{children}</>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <BlokkadeScherm
        reden={status?.reden}
        openstaandBedrag={status?.openstaandBedrag ?? 0}
        betaalUrl={status?.betaalUrl}
        onUitloggen={() => void signOut()}
      />
    </div>
  );
}
