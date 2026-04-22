import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { INSTALLATIE_STATUS_LABELS, type InstallatieStatus } from "./status";
import type { Installatie } from "./api/installatieApi";

interface Props {
  installatie: Installatie;
}

const TIJDLIJN_STAPPEN: InstallatieStatus[] = [
  "gepland",
  "onderweg",
  "in_uitvoering",
  "gereed",
  "afgerond",
];

function formatTijd(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function tijdVoorStap(stap: InstallatieStatus, installatie: Installatie): string | null {
  switch (stap) {
    case "gepland":
      return formatTijd(installatie.geplande_startdatum) ?? formatTijd(installatie.created_at);
    case "in_uitvoering":
      return formatTijd(installatie.werkelijke_starttijd);
    case "gereed":
      return formatTijd(installatie.gereedmelding_op) ?? formatTijd(installatie.werkelijke_eindtijd);
    default:
      return null;
  }
}

export default function InstallatieTijdlijn({ installatie }: Props) {
  const status = installatie.status as InstallatieStatus;

  if (status === "geannuleerd") {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-error" />
          <div>
            <Badge className="bg-error-light text-error">Geannuleerd</Badge>
            <p className="text-sm text-muted-foreground mt-1">Deze installatie is geannuleerd.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const huidigeIndex = TIJDLIJN_STAPPEN.indexOf(status);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Voortgang</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-wrap items-start gap-2 sm:gap-0 sm:flex-nowrap">
          {TIJDLIJN_STAPPEN.map((stap, i) => {
            const isVoltooid = huidigeIndex >= i && huidigeIndex !== -1;
            const isHuidig = huidigeIndex === i;
            const tijd = tijdVoorStap(stap, installatie);
            return (
              <li key={stap} className="flex-1 min-w-[120px] flex items-start gap-2 relative">
                <div className="flex flex-col items-center">
                  {isVoltooid ? (
                    <CheckCircle2 className={cn("h-6 w-6", isHuidig ? "text-primary" : "text-success")} />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/40" />
                  )}
                  {i < TIJDLIJN_STAPPEN.length - 1 && (
                    <div className={cn("hidden sm:block w-px h-6", isVoltooid ? "bg-success/40" : "bg-muted-foreground/20")} />
                  )}
                </div>
                <div className="pt-0.5">
                  <p className={cn("text-sm font-medium", isHuidig ? "text-primary" : isVoltooid ? "text-foreground" : "text-muted-foreground")}>
                    {INSTALLATIE_STATUS_LABELS[stap]}
                  </p>
                  {tijd && <p className="text-xs text-muted-foreground">{tijd}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}