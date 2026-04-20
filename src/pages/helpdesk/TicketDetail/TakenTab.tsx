import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTicketTaken } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function TakenTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { data: taken = [] } = useTicketTaken(ticket.id);

  return (
    <Card className="p-6 space-y-3">
      <h2 className="font-semibold">Taken</h2>
      {taken.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen taken. Taakbeheer komt in fase 3.</p>
      ) : (
        <ul className="divide-y divide-border">
          {taken.map((t) => (
            <li key={t.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t.titel}</p>
                {t.deadline && <p className="text-xs text-muted-foreground">Deadline: {new Date(t.deadline).toLocaleDateString("nl-NL")}</p>}
              </div>
              <Badge variant="outline">{t.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}