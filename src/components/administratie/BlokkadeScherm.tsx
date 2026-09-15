import { Ban, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CONTACT_EMAIL = "info@mijnhuis.nu";
export const CONTACT_TELEFOON = "085-060 6320";

const euro = (bedrag: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(bedrag);

export interface BlokkadeSchermProps {
  reden?: string | null;
  openstaandBedrag?: number;
  betaalUrl?: string | null;
  /** Uitlogactie; weglaten in de voorbeeldweergave. */
  onUitloggen?: () => void;
}

/** Scherm dat een geblokkeerde klant te zien krijgt. Ook gebruikt als voorbeeldweergave. */
export default function BlokkadeScherm({
  reden, openstaandBedrag = 0, betaalUrl, onUitloggen,
}: BlokkadeSchermProps) {
  return (
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
        {reden && <p className="text-muted-foreground">Reden: {reden}</p>}
        {openstaandBedrag > 0 && (
          <p>Openstaand bedrag: <span className="font-semibold">{euro(openstaandBedrag)}</span></p>
        )}
        {betaalUrl && (
          <Button asChild>
            <a href={betaalUrl} target="_blank" rel="noopener noreferrer">
              <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
              Nu betalen
            </a>
          </Button>
        )}
        <div className="space-y-1">
          <p>Vragen of al betaald?</p>
          <p>
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            {" — "}
            <a
              className="text-primary underline"
              href={`tel:${CONTACT_TELEFOON.replace(/[^0-9+]/g, "")}`}
            >
              {CONTACT_TELEFOON}
            </a>
          </p>
        </div>
        {onUitloggen && (
          <Button variant="outline" onClick={onUitloggen}>Uitloggen</Button>
        )}
      </CardContent>
    </Card>
  );
}
