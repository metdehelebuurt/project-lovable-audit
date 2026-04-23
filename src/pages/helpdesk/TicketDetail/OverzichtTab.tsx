import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Pencil } from "lucide-react";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import EditTicketDialog from "@/components/helpdesk/EditTicketDialog";
import TicketKoppelingenEditor from "@/components/helpdesk/TicketKoppelingenEditor";

export default function OverzichtTab({ ticket }: { ticket: HelpdeskTicket }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Probleemomschrijving
          </h2>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Bewerken
          </Button>
        </div>
        {ticket.omschrijving
          ? <p className="text-sm whitespace-pre-wrap">{ticket.omschrijving}</p>
          : <p className="text-sm text-muted-foreground">Geen omschrijving.</p>}
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Productcontext</h2>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Bewerken
          </Button>
        </div>
        <Row label="Categorie" value={ticket.product_categorie} />
        <Row label="Merk" value={ticket.product_merk} />
        <Row label="Type" value={ticket.product_type} />
        <Row label="Installatiejaar" value={ticket.product_installatiejaar?.toString()} />
        <Row label="Foutcode" value={ticket.foutcode} />
        <Row label="Geschatte duur" value={ticket.geschatte_duur_minuten ? `${ticket.geschatte_duur_minuten} min` : null} />
      </Card>

      <div className="lg:col-span-2">
        <TicketKoppelingenEditor ticket={ticket} />
      </div>

      <EditTicketDialog ticket={ticket} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}