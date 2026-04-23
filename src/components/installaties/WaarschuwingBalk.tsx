import { AlertTriangle } from "lucide-react";
import { useInstallatieGereedheid } from "@/hooks/installaties/useInstallatieGereedheid";
import type { Installatie } from "./api/installatieApi";

export default function WaarschuwingBalk({ installatie }: { installatie: Installatie }) {
  const { data } = useInstallatieGereedheid(installatie);
  if (!data || data.open_blokkades.length === 0) return null;

  const datum = installatie.geplande_startdatum
    ? new Date(installatie.geplande_startdatum).toLocaleDateString("nl-NL")
    : "geen datum";

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-destructive">
          {data.open_blokkades.length} blokkerend(e) item(s) openstaand
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Geplande datum: {datum} — {data.open_blokkades.map(b => b.label).join(" · ")}
        </p>
      </div>
    </div>
  );
}