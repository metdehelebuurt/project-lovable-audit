import { Card } from "@/components/ui/card";
import { Paperclip } from "lucide-react";
import { useTicketBijlagen } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function BijlagenTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { data: bijlagen = [] } = useTicketBijlagen(ticket.id);

  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-3">Bijlagen</h2>
      {bijlagen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen bijlagen. Upload-functie wordt toegevoegd in fase 2.</p>
      ) : (
        <ul className="space-y-2">
          {bijlagen.map((b) => (
            <li key={b.id} className="flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <a href={b.bestand_url} target="_blank" rel="noreferrer" className="hover:underline">
                {b.bestandsnaam}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}