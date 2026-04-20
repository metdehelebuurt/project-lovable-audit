import { Card } from "@/components/ui/card";
import { Paperclip } from "lucide-react";
import { useTicketBijlagen } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { BijlageUpload } from "@/components/helpdesk/BijlageUpload";
import { BijlageAnalyse } from "@/components/helpdesk/BijlageAnalyse";

export default function BijlagenTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { user } = useAuth();
  const { data: bijlagen = [] } = useTicketBijlagen(ticket.id);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Bijlagen</h2>
        {user ? <BijlageUpload ticketId={ticket.id} partnerId={ticket.partner_id} userId={user.id} /> : null}
      </div>
      {bijlagen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen bijlagen — voeg foto's, logbestanden of video's toe voor analyse.</p>
      ) : (
        <ul className="space-y-3">
          {bijlagen.map((b) => (
            <li key={b.id} className="border rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <a href={b.bestand_url} target="_blank" rel="noreferrer" className="hover:underline font-medium">
                  {b.bestandsnaam}
                </a>
                <span className="text-xs text-muted-foreground">
                  {b.mime_type ?? ""} {b.bestand_grootte ? `· ${Math.round(b.bestand_grootte / 1024)} KB` : ""}
                </span>
              </div>
              <BijlageAnalyse
                ticketId={ticket.id}
                partnerId={ticket.partner_id}
                bijlageId={b.id}
                bestandUrl={b.bestand_url}
                mimeType={b.mime_type}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}