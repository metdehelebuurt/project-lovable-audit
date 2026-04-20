import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTickets } from "@/hooks/helpdesk/useTickets";
import { PrioriteitBadge } from "@/components/helpdesk/PrioriteitBadge";
import { StatusBadge } from "@/components/helpdesk/StatusBadge";

export default function TicketsOverzicht() {
  const [zoekterm, setZoekterm] = useState("");
  const { data: tickets = [], isLoading } = useTickets({ zoekterm: zoekterm || undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Helpdesk tickets</h1>
          <p className="text-sm text-muted-foreground">Beheer alle service- en supportvragen</p>
        </div>
        <Button asChild>
          <Link to="/helpdesk/tickets/nieuw"><Plus className="h-4 w-4 mr-2" />Nieuw ticket</Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op ticketnummer, titel of omschrijving"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prioriteit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aangemaakt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Laden…</TableCell></TableRow>
            )}
            {!isLoading && tickets.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen tickets. Maak je eerste ticket aan.</TableCell></TableRow>
            )}
            {tickets.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs">
                  <Link to={`/helpdesk/tickets/${t.id}`} className="hover:underline">{t.ticketnummer}</Link>
                </TableCell>
                <TableCell className="font-medium">
                  <Link to={`/helpdesk/tickets/${t.id}`} className="hover:underline">{t.titel}</Link>
                </TableCell>
                <TableCell className="capitalize">{t.type.replace("_", " ")}</TableCell>
                <TableCell><PrioriteitBadge prio={t.prioriteit} /></TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(t.created_at).toLocaleDateString("nl-NL")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}