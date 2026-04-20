import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, AlertTriangle, Clock, CheckCircle2, Plus, RefreshCw, TimerReset } from "lucide-react";
import { useTickets } from "@/hooks/helpdesk/useTickets";
import { useMarkEscalations } from "@/hooks/helpdesk/useTicketDetail";
import { PrioriteitBadge } from "@/components/helpdesk/PrioriteitBadge";
import { StatusBadge } from "@/components/helpdesk/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";

export default function HelpdeskDashboard() {
  const { data: alle = [] } = useTickets();
  const { profile } = useAuth();
  const escaleer = useMarkEscalations();
  const open = alle.filter((t) => !["opgelost", "gesloten"].includes(t.status));
  const urgent = open.filter((t) => t.prioriteit === "urgent" || t.is_geescaleerd);
  const storingen = open.filter((t) => t.type === "storing");
  const slaOverschreden = open.filter(
    (t) => t.sla_deadline && new Date(t.sla_deadline) < new Date(),
  );
  const opgelostMaand = alle.filter((t) => {
    if (!t.opgelost_op) return false;
    const d = new Date(t.opgelost_op);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });

  useEffect(() => {
    if (profile?.partner_id && slaOverschreden.length > 0 && !escaleer.isPending) {
      escaleer.mutate(profile.partner_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.partner_id, slaOverschreden.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Helpdesk dashboard</h1>
          <p className="text-sm text-muted-foreground">Overzicht van openstaande tickets en service-activiteit</p>
        </div>
        <div className="flex gap-2">
          {profile?.partner_id ? (
            <Button variant="outline" onClick={() => escaleer.mutate(profile.partner_id!)} disabled={escaleer.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${escaleer.isPending ? "animate-spin" : ""}`} />
              SLA controleren
            </Button>
          ) : null}
          <Button asChild><Link to="/helpdesk/tickets/nieuw"><Plus className="h-4 w-4 mr-2" />Nieuw ticket</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={LifeBuoy} label="Openstaand" value={open.length} accent="text-primary" />
        <KpiCard icon={AlertTriangle} label="Urgent / escalatie" value={urgent.length} accent="text-destructive" />
        <KpiCard icon={Clock} label="Storingen open" value={storingen.length} accent="text-orange-600" />
        <KpiCard icon={TimerReset} label="SLA overschreden" value={slaOverschreden.length} accent="text-destructive" />
        <KpiCard icon={CheckCircle2} label="Opgelost deze maand" value={opgelostMaand.length} accent="text-green-600" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Hoge prioriteit & escalaties</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/helpdesk/tickets">Alle tickets</Link></Button>
        </div>
        {urgent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen urgente tickets — alles onder controle.</p>
        ) : (
          <ul className="divide-y divide-border">
            {urgent.slice(0, 8).map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/helpdesk/tickets/${t.id}`} className="font-medium hover:underline truncate block">
                    {t.ticketnummer} — {t.titel}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("nl-NL")}
                    {t.sla_deadline ? ` · SLA: ${new Date(t.sla_deadline).toLocaleString("nl-NL")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PrioriteitBadge prio={t.prioriteit} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {slaOverschreden.length > 0 ? (
        <Card className="p-6 border-destructive/30">
          <h2 className="font-semibold mb-3 text-destructive">SLA overschreden</h2>
          <ul className="divide-y divide-border">
            {slaOverschreden.slice(0, 8).map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                <Link to={`/helpdesk/tickets/${t.id}`} className="font-medium hover:underline truncate">
                  {t.ticketnummer} — {t.titel}
                </Link>
                <span className="text-xs text-destructive">
                  Verstreken {t.sla_deadline ? new Date(t.sla_deadline).toLocaleString("nl-NL") : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}