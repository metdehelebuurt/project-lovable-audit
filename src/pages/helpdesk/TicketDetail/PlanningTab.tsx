import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Siren } from "lucide-react";
import { ServiceBezoekDialog } from "@/components/helpdesk/ServiceBezoekDialog";
import { UrenVerantwoording } from "@/components/helpdesk/UrenVerantwoording";
import { useServiceBezoeken } from "@/hooks/helpdesk/useServiceBezoeken";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function PlanningTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { data: bezoeken = [], isLoading } = useServiceBezoeken(ticket.id);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h3 className="font-semibold">Planning</h3>
          <p className="text-sm text-muted-foreground">Plan een service-bezoek of activeer een storing direct.</p>
        </div>
        <div className="flex gap-2">
          <ServiceBezoekDialog ticket={ticket} type="service_bezoek" trigger={
            <Button variant="outline"><CalendarPlus className="h-4 w-4 mr-2" />Service-bezoek</Button>
          } />
          <ServiceBezoekDialog ticket={ticket} type="storing" trigger={
            <Button variant="destructive"><Siren className="h-4 w-4 mr-2" />Storing</Button>
          } />
        </div>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Laden…</p> : null}
      {!isLoading && bezoeken.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen bezoeken gepland.</p>
      ) : null}

      {bezoeken.map((b) => (
        <Card key={b.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-medium">{b.type === "storing" ? "Storing" : "Service-bezoek"}</p>
              <p className="text-sm text-muted-foreground">
                {b.geplande_datum ? new Date(b.geplande_datum).toLocaleDateString("nl-NL") : "Geen datum"}
                {b.geplande_tijd ? ` · ${b.geplande_tijd.slice(0, 5)}` : ""}
              </p>
            </div>
            <Badge variant={b.status === "afgerond" ? "default" : "secondary"}>{b.status}</Badge>
          </div>
          <UrenVerantwoording bezoek={b} />
        </Card>
      ))}
    </div>
  );
}