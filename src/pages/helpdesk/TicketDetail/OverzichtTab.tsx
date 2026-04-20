import { Card } from "@/components/ui/card";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function OverzichtTab({ ticket }: { ticket: HelpdeskTicket }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Probleemomschrijving</h2>
        {ticket.omschrijving
          ? <p className="text-sm whitespace-pre-wrap">{ticket.omschrijving}</p>
          : <p className="text-sm text-muted-foreground">Geen omschrijving.</p>}
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Productcontext</h2>
        <Row label="Categorie" value={ticket.product_categorie} />
        <Row label="Merk" value={ticket.product_merk} />
        <Row label="Type" value={ticket.product_type} />
        <Row label="Installatiejaar" value={ticket.product_installatiejaar?.toString()} />
        <Row label="Foutcode" value={ticket.foutcode} />
      </Card>

      <Card className="p-6 space-y-3 lg:col-span-2">
        <h2 className="font-semibold">Koppelingen</h2>
        <Row label="Klant" value={ticket.klant_id} />
        <Row label="Lead" value={ticket.lead_id} />
        <Row label="Opdracht" value={ticket.opdracht_id} />
        <Row label="Installatie" value={ticket.installatie_id} />
        <Row label="Factuur" value={ticket.factuur_id} />
      </Card>
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