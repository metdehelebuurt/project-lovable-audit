import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useTicket } from "@/hooks/helpdesk/useTicketDetail";
import { useUpdateTicket } from "@/hooks/helpdesk/useTickets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PrioriteitBadge } from "@/components/helpdesk/PrioriteitBadge";
import { StatusBadge } from "@/components/helpdesk/StatusBadge";
import { CsatDialog } from "@/components/helpdesk/CsatDialog";
import { useEffect, useState } from "react";
import OverzichtTab from "./OverzichtTab";
import CommunicatieTab from "./CommunicatieTab";
import BijlagenTab from "./BijlagenTab";
import TakenTab from "./TakenTab";
import OplossingTab from "./OplossingTab";
import HistorieTab from "./HistorieTab";
import AnalyzerTab from "./AnalyzerTab";
import PlanningTab from "./PlanningTab";
import KlantContactStrook from "@/components/helpdesk/KlantContactStrook";
import EditTicketDialog from "@/components/helpdesk/EditTicketDialog";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: ticket, isLoading } = useTicket(id);
  const update = useUpdateTicket();
  const { profile } = useAuth();
  const [csatOpen, setCsatOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Open CSAT-dialog na sluiten als er nog geen CSAT-record bestaat voor dit ticket
  useEffect(() => {
    if (!ticket || !["opgelost", "gesloten"].includes(ticket.status)) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("helpdesk_csat" as never).select("id").eq("ticket_id", ticket.id).limit(1);
      const arr = (data ?? []) as Array<{ id: string }>;
      if (!cancelled && arr.length === 0) setCsatOpen(true);
    })();
    return () => { cancelled = true; };
  }, [ticket?.id, ticket?.status]);

  const { data: collegas = [] } = useQuery({
    queryKey: ["partner-collegas", profile?.partner_id],
    enabled: !!profile?.partner_id,
    queryFn: async () => {
      const { data } = await supabase.from("users")
        .select("id, voornaam, achternaam, rol")
        .eq("partner_id", profile!.partner_id)
        .in("rol", ["partner_admin", "partner_staff", "adviseur", "installateur"])
        .order("voornaam");
      return (data ?? []) as Array<{ id: string; voornaam: string; achternaam: string; rol: string }>;
    },
  });

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
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Bewerken
            </Button>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <Select
                value={ticket.toegewezen_aan ?? "none"}
                onValueChange={(v) => update.mutate({ id: ticket.id, toegewezen_aan: v === "none" ? null : v })}
              >
                <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Toewijzen aan…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Niet toegewezen</SelectItem>
                  {collegas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.voornaam} {c.achternaam} <span className="text-muted-foreground">· {c.rol.replace("_", " ")}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={ticket.prioriteit} onValueChange={(v) => update.mutate({ id: ticket.id, prioriteit: v })}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="laag">Laag</SelectItem>
                <SelectItem value="normaal">Normaal</SelectItem>
                <SelectItem value="hoog">Hoog</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ticket.status} onValueChange={(v) => update.mutate({ id: ticket.id, status: v })}>
              <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nieuw">Nieuw</SelectItem>
                <SelectItem value="in_behandeling">In behandeling</SelectItem>
                <SelectItem value="wacht_op_klant">Wacht op klant</SelectItem>
                <SelectItem value="wacht_op_intern">Wacht intern</SelectItem>
                <SelectItem value="wacht_op_onderdeel">Wacht op onderdeel</SelectItem>
                <SelectItem value="ingepland">Ingepland</SelectItem>
                <SelectItem value="onderweg">Onderweg</SelectItem>
                <SelectItem value="opgelost">Opgelost</SelectItem>
                <SelectItem value="gesloten">Gesloten</SelectItem>
              </SelectContent>
            </Select>
            <PrioriteitBadge prio={ticket.prioriteit} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </Card>

      <KlantContactStrook klantId={ticket.klant_id} />

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

      <CsatDialog
        open={csatOpen}
        onOpenChange={setCsatOpen}
        ticketId={ticket.id}
        partnerId={ticket.partner_id}
        ticketnummer={ticket.ticketnummer}
      />

      <EditTicketDialog ticket={ticket} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}