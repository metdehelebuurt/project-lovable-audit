import { History } from "lucide-react";
import { useLeadHistorie } from "@/hooks/affiliate/useLeadHistorie";

const ACTIE_LABEL: Record<string, string> = {
  aangemaakt: "Aangemaakt",
  status_gewijzigd: "Status gewijzigd",
  eigenaar_gewijzigd: "Eigenaar gewijzigd",
  fase_gewijzigd: "Fase gewijzigd",
  temperatuur_gewijzigd: "Temperatuur gewijzigd",
  waarde_gewijzigd: "Waarde gewijzigd",
  kvk_gewijzigd: "KvK-nummer gewijzigd",
  btw_gewijzigd: "BTW-nummer gewijzigd",
  adres_gewijzigd: "Adres gewijzigd",
  website_gewijzigd: "Website gewijzigd",
};

interface Props {
  leadId: string;
}

export function HistorieTab({ leadId }: Props) {
  const { data = [], isLoading } = useLeadHistorie(leadId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Historie laden…</p>;
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic flex items-center gap-2">
        <History className="h-4 w-4" /> Nog geen historie geregistreerd voor deze lead.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((h) => (
        <div key={h.id} className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {ACTIE_LABEL[h.actie] ?? h.actie}
              {h.veld && ` · ${h.veld}`}
            </span>
            <span>
              {h.actor_naam ?? "Systeem"}
              {h.actor_rol && ` (${h.actor_rol})`} ·{" "}
              {new Date(h.created_at).toLocaleString("nl-NL")}
            </span>
          </div>
          {(h.oude_waarde || h.nieuwe_waarde) && (
            <p className="mt-1 text-xs">
              <span className="text-muted-foreground line-through">{h.oude_waarde ?? "—"}</span>
              {" → "}
              <span className="font-medium">{h.nieuwe_waarde ?? "—"}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}