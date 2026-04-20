import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateTicket } from "@/hooks/helpdesk/useTickets";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function OplossingTab({ ticket }: { ticket: HelpdeskTicket }) {
  const [oplossing, setOplossing] = useState(ticket.oplossing ?? "");
  const update = useUpdateTicket();

  const opslaan = async (sluiten: boolean) => {
    await update.mutateAsync({
      id: ticket.id,
      oplossing: oplossing || null,
      ...(sluiten ? { status: "opgelost", opgelost_op: new Date().toISOString() } : {}),
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Oplossing</h2>
        <p className="text-sm text-muted-foreground">Verplicht voordat een ticket op opgelost gezet wordt. AI gebruikt dit om de kennisbank uit te breiden.</p>
      </div>
      <Textarea rows={8} value={oplossing} onChange={(e) => setOplossing(e.target.value)} placeholder="Beschrijf wat het probleem was en hoe het opgelost is" />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => opslaan(false)} disabled={update.isPending}>Tussentijds opslaan</Button>
        <Button onClick={() => opslaan(true)} disabled={update.isPending || !oplossing.trim()}>Markeer als opgelost</Button>
      </div>
    </Card>
  );
}