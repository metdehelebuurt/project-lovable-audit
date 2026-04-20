import { Card } from "@/components/ui/card";
import { useTicketHistorie } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function HistorieTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { data: historie = [] } = useTicketHistorie(ticket.id);

  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-3">Wijzigingshistorie</h2>
      {historie.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen historische wijzigingen.</p>
      ) : (
        <ul className="space-y-2">
          {historie.map((h) => (
            <li key={h.id} className="text-sm border-l-2 border-border pl-3">
              <p className="font-medium">{h.actie}{h.veld ? ` · ${h.veld}` : ""}</p>
              {h.oude_waarde || h.nieuwe_waarde ? (
                <p className="text-xs text-muted-foreground">{h.oude_waarde ?? "—"} → {h.nieuwe_waarde ?? "—"}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("nl-NL")}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}