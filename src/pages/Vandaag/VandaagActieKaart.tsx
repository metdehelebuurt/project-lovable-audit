import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, CheckSquare, Mail, PhoneCall, AlertTriangle } from "lucide-react";
import type { ActiecentrumCounts } from "@/hooks/useActiecentrum";

/**
 * Compacte kaart die de openstaande actiecentrum-counts toont met links
 * naar de relevante tabs. Wordt alleen getoond als er > 0 acties zijn.
 */
export function VandaagActieKaart({ counts }: { counts: ActiecentrumCounts }) {
  const navigate = useNavigate();
  const items = [
    { label: "Notificaties", value: counts.notificaties, icon: Bell, tab: "notificaties" },
    { label: "Taken", value: counts.taken, icon: CheckSquare, tab: "taken" },
    { label: "Berichten", value: counts.berichten, icon: Mail, tab: "berichten" },
    { label: "Terugbellen", value: counts.terugbel, icon: PhoneCall, tab: "terugbel" },
    { label: "Aandacht", value: counts.aandacht, icon: AlertTriangle, tab: "aandacht" },
  ].filter((i) => i.value > 0);

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold">Vraagt om actie</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {counts.totaal} {counts.totaal === 1 ? "openstaande actie" : "openstaande acties"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/actiecentrum")}
            className="gap-1.5"
          >
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {items.map(({ label, value, icon: Icon, tab }) => (
            <button
              key={tab}
              type="button"
              onClick={() => navigate(`/actiecentrum?tab=${tab}`)}
              className="flex items-center gap-2 p-3 rounded-xl bg-card hover:bg-accent transition-colors text-left"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-base font-bold leading-tight">{value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{label}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}