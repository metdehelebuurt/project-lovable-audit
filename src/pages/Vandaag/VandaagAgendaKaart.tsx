import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight, MapPin } from "lucide-react";
import type { VandaagAfspraak } from "./useVandaagData";

const TYPE_LABEL: Record<string, string> = {
  schouw: "Schouw", installatie: "Installatie", oplevering: "Oplevering",
  bezoek: "Bezoek", gesprek: "Gesprek", afspraak: "Afspraak",
};

function tijdRange(start: string | null, eind: string | null): string {
  if (!start) return "Hele dag";
  const s = start.slice(0, 5);
  const e = eind?.slice(0, 5);
  return e ? `${s} – ${e}` : s;
}

export function VandaagAgendaKaart({
  afspraken, isLoading,
}: { afspraken: VandaagAfspraak[]; isLoading: boolean }) {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Agenda vandaag
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/planning")} className="gap-1.5">
          Planning <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : afspraken.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Geen afspraken vandaag.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {afspraken.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center gap-3">
                <div className="w-20 shrink-0 text-xs font-medium text-foreground tabular-nums">
                  {tijdRange(a.start_tijd, a.eind_tijd)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.klant_naam || a.titel}
                  </p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <span>{TYPE_LABEL[a.type] ?? a.type}</span>
                    {a.locatie && (
                      <>
                        <span>·</span>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{a.locatie}</span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}