import { useMemo } from "react";
import { Activity, ArrowRight, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLeadHistorie } from "@/hooks/affiliate/useLeadHistorie";
import { useAffiliatePipelineConfig } from "@/hooks/affiliate/useAffiliatePipelineConfig";
import { kleurBadge, kleurDot } from "@/lib/affiliate/pipelineKleur";
import { STATUS_LABEL } from "@/lib/affiliate/leadStatus";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import type { TerugbelAfspraak } from "@/hooks/affiliate/useTerugbelAfspraken";

type Props = {
  lead: AffiliateLead;
  afspraken: TerugbelAfspraak[];
};

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelatief(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const uur = Math.round(min / 60);
  if (uur < 24) return `${uur} uur geleden`;
  const dag = Math.round(uur / 24);
  if (dag < 30) return `${dag} dag${dag === 1 ? "" : "en"} geleden`;
  return new Date(iso).toLocaleDateString("nl-NL");
}

function statusLabelVoor(key: string | null): string {
  if (!key) return "—";
  return STATUS_LABEL[key as keyof typeof STATUS_LABEL] ?? key;
}

export function StatusKaart({ lead, afspraken }: Props) {
  const { data: historie = [] } = useLeadHistorie(lead.id);
  const { data: pipelineConfig = [] } = useAffiliatePipelineConfig();
  const fase = pipelineConfig.find((f) => f.status_key === lead.status);

  const laatsteStatusWijziging = useMemo(
    () => historie.find((h) => h.veld === "status" && h.nieuwe_waarde),
    [historie],
  );

  const volgendeAfspraak = useMemo(() => {
    const nu = Date.now();
    return afspraken
      .filter((a) => a.lead_id === lead.id && !a.afgehandeld_op && new Date(a.geplande_op).getTime() >= nu)
      .sort((a, b) => new Date(a.geplande_op).getTime() - new Date(b.geplande_op).getTime())[0];
  }, [afspraken, lead.id]);

  return (
    <div className="grid sm:grid-cols-3 gap-2 rounded-lg border bg-card p-3">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Activity className="h-3 w-3" /> Status
        </p>
        {fase ? (
          <Badge variant="outline" className={`gap-1.5 ${kleurBadge(fase.kleur)}`}>
            <span className={`h-2 w-2 rounded-full ${kleurDot(fase.kleur)}`} />
            {fase.label}
          </Badge>
        ) : (
          <Badge variant="secondary">{statusLabelVoor(lead.status)}</Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          Laatste wijziging
        </p>
        {laatsteStatusWijziging ? (
          <div className="text-xs">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-muted-foreground line-through">
                {statusLabelVoor(laatsteStatusWijziging.oude_waarde)}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {statusLabelVoor(laatsteStatusWijziging.nieuwe_waarde)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatRelatief(laatsteStatusWijziging.created_at)}
              {laatsteStatusWijziging.actor_naam ? ` · ${laatsteStatusWijziging.actor_naam}` : ""}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nog geen statuswijzigingen.</p>
        )}
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="h-3 w-3" /> Volgende afspraak
        </p>
        {volgendeAfspraak ? (
          <div className="text-xs">
            <p className="font-medium capitalize">
              {volgendeAfspraak.type === "demo" ? "Demo" : "Terugbellen"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDatum(volgendeAfspraak.geplande_op)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Geen geplande afspraak.</p>
        )}
      </div>
    </div>
  );
}

export default StatusKaart;