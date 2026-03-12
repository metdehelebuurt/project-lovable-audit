import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Database, Json } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPrioritiet = Database["public"]["Enums"]["ticket_prioriteit"];

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_naam: string;
  bericht: string;
  datum: string;
}

interface Ticket {
  id: string;
  ticketnummer: string;
  onderwerp: string;
  beschrijving: string;
  status: TicketStatus;
  prioriteit: TicketPrioritiet;
  categorie: string | null;
  consument_id: string;
  partner_id: string;
  berichten_json: Json | null;
  created_at: string;
}

const statusLabels: Record<TicketStatus, string> = {
  open: "Open", in_behandeling: "In behandeling", wacht_op_klant: "Wacht op klant", opgelost: "Opgelost", gesloten: "Gesloten",
};
const statusColors: Record<TicketStatus, string> = {
  open: "bg-primary/10 text-primary", in_behandeling: "bg-warning-light text-warning-foreground",
  wacht_op_klant: "bg-accent text-accent-foreground", opgelost: "bg-success-light text-success", gesloten: "bg-muted text-muted-foreground",
};
const prioriteitLabels: Record<TicketPrioritiet, string> = {
  laag: "Laag", normaal: "Normaal", hoog: "Hoog", urgent: "Urgent",
};

const Berichten = () => {
  const { profile, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({
    onderwerp: "", beschrijving: "", categorie: "", prioriteit: "normaal" as TicketPrioritiet,
  });

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const generateTicketNr = () => `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleCreate = async () => {
    if (!form.onderwerp.trim() || !form.beschrijving.trim()) { toast.error("Onderwerp en beschrijving zijn verplicht"); return; }
    const initialMsg: ChatMessage = {
      id: crypto.randomUUID(), sender_id: user!.id,
      sender_naam: `${profile!.voornaam} ${profile!.achternaam}`,
      bericht: form.beschrijving, datum: new Date().toISOString(),
    };
    const { error } = await supabase.from("tickets").insert({
      ticketnummer: generateTicketNr(), onderwerp: form.onderwerp, beschrijving: form.beschrijving,
      categorie: form.categorie || null, prioriteit: form.prioriteit,
      consument_id: user!.id, partner_id: profile!.partner_id ?? "",
      berichten_json: [initialMsg] as unknown as Json,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket aangemaakt");
    setOpen(false);
    setForm({ onderwerp: "", beschrijving: "", categorie: "", prioriteit: "normaal" });
    fetchTickets();
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status bijgewerkt");
    fetchTickets();
    if (activeTicket?.id === id) setActiveTicket((prev) => prev ? { ...prev, status } : null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket) return;
    const existing = (Array.isArray(activeTicket.berichten_json) ? activeTicket.berichten_json : []) as ChatMessage[];
    const msg: ChatMessage = {
      id: crypto.randomUUID(), sender_id: user!.id,
      sender_naam: `${profile!.voornaam} ${profile!.achternaam}`,
      bericht: newMessage, datum: new Date().toISOString(),
    };
    const updated = [...existing, msg];
    const { error } = await supabase.from("tickets").update({ berichten_json: updated as unknown as Json }).eq("id", activeTicket.id);
    if (error) { toast.error(error.message); return; }
    setActiveTicket({ ...activeTicket, berichten_json: updated as unknown as Json });
    setNewMessage("");
    // Also update in list
    setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, berichten_json: updated as unknown as Json } : t));
  };

  const filtered = tickets.filter((t) =>
    t.onderwerp.toLowerCase().includes(search.toLowerCase()) || t.ticketnummer.toLowerCase().includes(search.toLowerCase())
  );

  const messages = activeTicket ? ((Array.isArray(activeTicket.berichten_json) ? activeTicket.berichten_json : []) as unknown as ChatMessage[]) : [];

  // Chat detail view
  if (activeTicket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveTicket(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{activeTicket.onderwerp}</h1>
            <p className="text-sm text-muted-foreground">{activeTicket.ticketnummer} · {statusLabels[activeTicket.status]}</p>
          </div>
          <Select value={activeTicket.status} onValueChange={(v) => handleStatusChange(activeTicket.id, v as TicketStatus)}>
            <SelectTrigger className="w-[160px]">
              <Badge className={statusColors[activeTicket.status]}>{statusLabels[activeTicket.status]}</Badge>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="rounded-2xl border-0 shadow-sm flex flex-col" style={{ height: "calc(100vh - 260px)" }}>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nog geen berichten</p>
              )}
              {messages.map((m) => {
                const isOwn = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <p className="text-xs font-medium mb-1 opacity-70">{m.sender_naam}</p>
                      <p className="text-sm whitespace-pre-wrap">{m.bericht}</p>
                      <p className="text-[10px] mt-1 opacity-50">
                        {format(new Date(m.datum), "d MMM HH:mm", { locale: nl })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="border-t border-border p-4 flex gap-2">
            <Input
              placeholder="Typ een bericht..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Berichten</h1>
          <p className="text-muted-foreground mt-1">Support tickets en berichten</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nieuw ticket</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nieuw support ticket</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div><Label>Onderwerp *</Label><Input value={form.onderwerp} onChange={(e) => setForm({ ...form, onderwerp: e.target.value })} /></div>
              <div><Label>Categorie</Label><Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="bijv. Technisch, Factuur" /></div>
              <div>
                <Label>Prioriteit</Label>
                <Select value={form.prioriteit} onValueChange={(v) => setForm({ ...form, prioriteit: v as TicketPrioritiet })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(prioriteitLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Beschrijving *</Label><Textarea rows={4} value={form.beschrijving} onChange={(e) => setForm({ ...form, beschrijving: e.target.value })} /></div>
              <Button onClick={handleCreate}>Verstuur</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nummer</TableHead>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Prioriteit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Geen tickets gevonden</TableCell></TableRow>
              ) : filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTicket(t)}>
                  <TableCell className="font-mono text-xs">{t.ticketnummer}</TableCell>
                  <TableCell className="font-medium">{t.onderwerp}</TableCell>
                  <TableCell>
                    <Badge variant={t.prioriteit === "urgent" || t.prioriteit === "hoog" ? "destructive" : "secondary"}>
                      {prioriteitLabels[t.prioriteit]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(t.created_at).toLocaleDateString("nl-NL")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Berichten;
