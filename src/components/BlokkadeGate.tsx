import { ReactNode } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerBlokkadeStatus } from "@/hooks/administratie/usePartnerBlokkadeStatus";

const CONTACT_EMAIL = "info@mijnhuis.nu";
const CONTACT_TELEFOON = "085-060 6320";

const euro = (bedrag: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(bedrag);

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
      <Card className="max-w-lg w-full">
        <CardHeader className="space-y-2">
          <Ban className="h-8 w-8 text-destructive" aria-hidden="true" />
          <CardTitle>Toegang tijdelijk opgeschort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            De toegang van je organisatie is opgeschort wegens een openstaande betaling.
            Zodra de betaling is verwerkt, zetten wij de toegang direct weer open.
          </p>
          {status?.reden && <p className="text-muted-foreground">Reden: {status.reden}</p>}
          {!!status?.openstaandBedrag && (
            <p>Openstaand bedrag: <span className="font-semibold">{euro(status.openstaandBedrag)}</span></p>
          )}
          <div className="space-y-1">
            <p>Vragen of al betaald?</p>
            <p>
              <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              {" — "}
              <a className="text-primary underline" href={`tel:${CONTACT_TELEFOON.replace(/[^0-9+]/g, "")}`}>{CONTACT_TELEFOON}</a>
            </p>
          </div>
          <Button variant="outline" onClick={() => void signOut()}>Uitloggen</Button>
        </CardContent>
      </Card>
    </div>
  );
}
