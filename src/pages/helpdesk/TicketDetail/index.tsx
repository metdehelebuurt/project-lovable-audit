import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useTicket } from "@/hooks/helpdesk/useTicketDetail";
import { PrioriteitBadge } from "@/components/helpdesk/PrioriteitBadge";
import { StatusBadge } from "@/components/helpdesk/StatusBadge";
import OverzichtTab from "./OverzichtTab";
import CommunicatieTab from "./CommunicatieTab";
import BijlagenTab from "./BijlagenTab";
import TakenTab from "./TakenTab";
import OplossingTab from "./OplossingTab";
import HistorieTab from "./HistorieTab";
import AnalyzerTab from "./AnalyzerTab";
import PlanningTab from "./PlanningTab";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: ticket, isLoading } = useTicket(id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Laden…</p>;
  if (!ticket) return <p className="text-sm text-muted-foreground">Ticket niet gevonden.</p>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/helpdesk/tickets"><ArrowLeft className="h-4 w-4 mr-2" />Terug naar overzicht</Link>
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted-foreground">{ticket.ticketnummer}</p>
            <h1 className="text-2xl font-semibold mt-1">{ticket.titel}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Aangemaakt {new Date(ticket.created_at).toLocaleString("nl-NL")} · Bron: {ticket.bron_locatie}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PrioriteitBadge prio={ticket.prioriteit} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overzicht" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="analyzer">AI Analyzer</TabsTrigger>
          <TabsTrigger value="communicatie">Communicatie</TabsTrigger>
          <TabsTrigger value="bijlagen">Bijlagen</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="taken">Taken</TabsTrigger>
          <TabsTrigger value="oplossing">Oplossing</TabsTrigger>
          <TabsTrigger value="historie">Historie</TabsTrigger>
        </TabsList>
        <TabsContent value="overzicht"><OverzichtTab ticket={ticket} /></TabsContent>
        <TabsContent value="analyzer"><AnalyzerTab ticket={ticket} /></TabsContent>
        <TabsContent value="communicatie"><CommunicatieTab ticket={ticket} /></TabsContent>
        <TabsContent value="bijlagen"><BijlagenTab ticket={ticket} /></TabsContent>
        <TabsContent value="planning"><PlanningTab ticket={ticket} /></TabsContent>
        <TabsContent value="taken"><TakenTab ticket={ticket} /></TabsContent>
        <TabsContent value="oplossing"><OplossingTab ticket={ticket} /></TabsContent>
        <TabsContent value="historie"><HistorieTab ticket={ticket} /></TabsContent>
      </Tabs>
    </div>
  );
}