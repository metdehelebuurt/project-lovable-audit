import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTicketTaken, useDeleteTaak, type TicketTaak } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { TaakDialog } from "@/components/helpdesk/TaakDialog";

export default function TakenTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { user } = useAuth();
  const { data: taken = [] } = useTicketTaken(ticket.id);
  const del = useDeleteTaak();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TicketTaak | null>(null);

  const start = (t: TicketTaak | null) => {
    setEditing(t);
    setOpen(true);
  };

  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Taken</h2>
        {user ? (
          <Button size="sm" onClick={() => start(null)}>
            <Plus className="h-4 w-4 mr-1" />Nieuwe taak
          </Button>
        ) : null}
      </div>
      {taken.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen taken.</p>
      ) : (
        <ul className="divide-y divide-border">
          {taken.map((t) => (
            <li key={t.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{t.titel}</p>
                {t.omschrijving ? <p className="text-xs text-muted-foreground line-clamp-2">{t.omschrijving}</p> : null}
                {t.deadline && (
                  <p className="text-xs text-muted-foreground">
                    Deadline: {new Date(t.deadline).toLocaleDateString("nl-NL")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{t.prioriteit}</Badge>
                <Badge>{t.status}</Badge>
                <Button size="icon" variant="ghost" onClick={() => start(t)} aria-label="Bewerken">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => del.mutate({ id: t.id, ticket_id: t.ticket_id })}
                  aria-label="Verwijderen"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {user ? (
        <TaakDialog
          open={open}
          onOpenChange={setOpen}
          ticketId={ticket.id}
          partnerId={ticket.partner_id}
          userId={user.id}
          taak={editing}
        />
      ) : null}
    </Card>
  );
}