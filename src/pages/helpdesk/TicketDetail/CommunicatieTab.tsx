import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketBerichten, useAddBericht } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function CommunicatieTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { user } = useAuth();
  const { data: berichten = [] } = useTicketBerichten(ticket.id);
  const add = useAddBericht();
  const [inhoud, setInhoud] = useState("");
  const [richting, setRichting] = useState("intern");

  const send = async () => {
    if (!user || !inhoud.trim()) return;
    await add.mutateAsync({
      ticket_id: ticket.id,
      partner_id: ticket.partner_id,
      auteur_id: user.id,
      richting,
      inhoud: inhoud.trim(),
    });
    setInhoud("");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <ul className="space-y-3 max-h-[480px] overflow-y-auto">
          {berichten.length === 0 && <p className="text-sm text-muted-foreground">Nog geen berichten.</p>}
          {berichten.map((b) => (
            <li key={b.id} className="border-l-2 border-primary pl-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{b.richting}</span>
                <span>{new Date(b.created_at).toLocaleString("nl-NL")}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap mt-1">{b.inhoud}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Select value={richting} onValueChange={setRichting}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="intern">Interne notitie</SelectItem>
              <SelectItem value="uitgaand">Naar klant</SelectItem>
              <SelectItem value="inkomend">Van klant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea rows={4} placeholder="Typ je bericht…" value={inhoud} onChange={(e) => setInhoud(e.target.value)} />
        <div className="flex justify-end">
          <Button onClick={send} disabled={!inhoud.trim() || add.isPending}>
            {add.isPending ? "Versturen…" : "Bericht plaatsen"}
          </Button>
        </div>
      </Card>
    </div>
  );
}