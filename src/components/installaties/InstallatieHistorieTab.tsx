import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";
import { fetchInstallatieHistorie } from "./api/installatieApi";

interface HistorieRij {
  id: string;
  actie: string;
  veld: string | null;
  oude_waarde: string | null;
  nieuwe_waarde: string | null;
  created_at: string;
}

const actieLabels: Record<string, string> = {
  aangemaakt: "Installatie aangemaakt",
  status_gewijzigd: "Status gewijzigd",
  monteur_gewijzigd: "Monteur gewijzigd",
  datum_gewijzigd: "Datum gewijzigd",
  gereed_gemeld: "Gereed gemeld",
};

export default function InstallatieHistorieTab({ installatieId }: { installatieId: string }) {
  const [rijen, setRijen] = useState<HistorieRij[]>([]);

  useEffect(() => {
    void fetchInstallatieHistorie(installatieId).then((d) => setRijen(d as HistorieRij[]));
  }, [installatieId]);

  if (rijen.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Nog geen historie</p>;
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="py-4 space-y-3">
        {rijen.map((r) => (
          <div key={r.id} className="flex gap-3 items-start">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{actieLabels[r.actie] ?? r.actie}</p>
              {r.oude_waarde && r.nieuwe_waarde && (
                <p className="text-xs text-muted-foreground">
                  van <span className="font-mono">{r.oude_waarde}</span> naar <span className="font-mono">{r.nieuwe_waarde}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("nl-NL")}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}