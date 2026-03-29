import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Send, ArrowLeft, MessageSquare, FileText, Inbox, MailCheck, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Database, Json } from "@/integrations/supabase/types";
import EmailInbox from "@/components/email/EmailInbox";
import EmailLog from "@/components/email/EmailLog";
import EmailTemplates from "@/components/email/EmailTemplates";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPrioriteit = Database["public"]["Enums"]["ticket_prioriteit"];

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
  prioriteit: TicketPrioriteit;
  categorie: string | null;
  consument_id: string;
  partner_id: string;
  berichten_json: Json | null;
  created_at: string;
}

interface OfferteBericht {
  id: string;
  offerte_id: string;
  share_token: string;
  afzender_type: string;
  afzender_naam: string;
  bericht: string;
  created_at: string;
}

const statusLabels: Record<TicketStatus, string> = {
  open: "Open", in_behandeling: "In behandeling", wacht_op_klant: "Wacht op klant", opgelost: "Opgelost", gesloten: "Gesloten",
};
const statusColors: Record<TicketStatus, string> = {
  open: "bg-primary/10 text-primary", in_behandeling: "bg-warning-light text-warning-foreground",
  wacht_op_klant: "bg-accent text-accent-foreground", opgelost: "bg-success-light text-success", gesloten: "bg-muted text-muted-foreground",
};
const prioriteitLabels: Record<TicketPrioriteit, string> = {
  laag: "Laag", normaal: "Normaal", hoog: "Hoog", urgent: "Urgent",
};

/* ─── Klantberichten Tab Component ─── */
function KlantBerichtenTab() {
  const { profile, user } = useAuth();
  const [conversations, setConversations] = useState<{ offerte_id: string; offertenummer: string; klant_naam: string; latest: string; unread: number }[]>([]);
  const [activeOfferte, setActiveOfferte] = useState<{ offerte_id: string; offertenummer: string; klant_naam: string; share_token: string } | null>(null);
  const [messages, setMessages] = useState<OfferteBericht[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    // Get all offerte_berichten for this partner's offertes
    const { data: berichten } = await supabase
      .from("offerte_berichten")
      .select("offerte_id, afzender_naam, afzender_type, bericht, created_at, share_token")
      .order("created_at", { ascending: false });

    if (!berichten || berichten.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by offerte_id
    const grouped: Record<string, typeof berichten> = {};
    berichten.forEach((b) => {
      if (!grouped[b.offerte_id]) grouped[b.offerte_id] = [];
      grouped[b.offerte_id].push(b);
    });

    // Get offerte details
    const offerteIds = Object.keys(grouped);
    const { data: offertes } = await supabase
      .from("offertes")
      .select("id, offertenummer, klant_naam, share_token")
      .in("id", offerteIds);

    const convs = offerteIds.map((oid) => {
      const msgs = grouped[oid];
      const offerte = offertes?.find((o) => o.id === oid);
      return {
        offerte_id: oid,
        offertenummer: offerte?.offertenummer || "Onbekend",
        klant_naam: offerte?.klant_naam || msgs[0]?.afzender_naam || "Onbekend",
        latest: msgs[0]?.created_at || "",
        unread: msgs.filter((m) => m.afzender_type === "klant").length,
        share_token: offerte?.share_token || msgs[0]?.share_token || "",
      };
    }).sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());

    setConversations(convs);
    setLoading(false);
  };

  useEffect(() => { loadConversations(); }, []);

  const loadMessages = async (offerteId: string) => {
    const { data } = await supabase
      .from("offerte_berichten")
      .select("*")
      .eq("offerte_id", offerteId)
      .order("created_at", { ascending: true });
    setMessages((data as OfferteBericht[]) || []);
  };

  useEffect(() => {
    if (activeOfferte) {
      loadMessages(activeOfferte.offerte_id);
      const interval = setInterval(() => loadMessages(activeOfferte.offerte_id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeOfferte]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMsg.trim() || !activeOfferte) return;
    const { error } = await supabase.from("offerte_berichten").insert({
      offerte_id: activeOfferte.offerte_id,
      share_token: activeOfferte.share_token,
      afzender_type: "partner",
      afzender_naam: `${profile!.voornaam} ${profile!.achternaam}`,
      bericht: newMsg.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setNewMsg("");
    loadMessages(activeOfferte.offerte_id);
  };

  if (activeOfferte) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveOfferte(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{activeOfferte.klant_naam}</h2>
            <p className="text-sm text-muted-foreground">{activeOfferte.offertenummer}</p>
          </div>
        </div>
        <Card className="rounded-2xl border-0 shadow-sm flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nog geen berichten</p>
              )}
              {messages.map((m) => {
                const isOwn = m.afzender_type === "partner";
                return (
                  <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <p className="text-xs font-medium mb-1 opacity-70">{m.afzender_naam}</p>
                      <p className="text-sm whitespace-pre-wrap">{m.bericht}</p>
                      <p className="text-[10px] mt-1 opacity-50">
                        {format(new Date(m.created_at), "d MMM HH:mm", { locale: nl })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          <div className="border-t border-border p-4 flex gap-2">
            <Input
              placeholder="Typ een bericht..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMsg.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offerte</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Laatste bericht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
            ) : conversations.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nog geen klantberichten</TableCell></TableRow>
            ) : conversations.map((c) => (
              <TableRow key={c.offerte_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveOfferte({ offerte_id: c.offerte_id, offertenummer: c.offertenummer, klant_naam: c.klant_naam, share_token: (c as any).share_token })}>
                <TableCell className="font-mono text-xs">{c.offertenummer}</TableCell>
                <TableCell className="font-medium">{c.klant_naam}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.latest ? format(new Date(c.latest), "d MMM HH:mm", { locale: nl }) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ─── Main Berichten Component ─── */
const Berichten = () => {
  const { profile, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({
    onderwerp: "", beschrijving: "", categorie: "", prioriteit: "normaal" as TicketPrioriteit,
  });

  const isPartnerRole = ["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(profile?.rol || "");

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
    const existing = (Array.isArray(activeTicket.berichten_json) ? activeTicket.berichten_json : []) as unknown as ChatMessage[];
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
    setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, berichten_json: updated as unknown as Json } : t));
  };

  const filtered = tickets.filter((t) =>
    t.onderwerp.toLowerCase().includes(search.toLowerCase()) || t.ticketnummer.toLowerCase().includes(search.toLowerCase())
  );

  const ticketMessages = activeTicket ? ((Array.isArray(activeTicket.berichten_json) ? activeTicket.berichten_json : []) as unknown as ChatMessage[]) : [];

  // Ticket detail view
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
              {ticketMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nog geen berichten</p>
              )}
              {ticketMessages.map((m) => {
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

  // Ticket list content
  const TicketListContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                <Select value={form.prioriteit} onValueChange={(v) => setForm({ ...form, prioriteit: v as TicketPrioriteit })}>
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
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Berichten & E-mail</h1>
        <p className="text-muted-foreground mt-1">E-mail inbox, verzonden berichten, templates en support</p>
      </div>

      {isPartnerRole ? (
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="inbox" className="gap-1.5">
              <Inbox className="h-3.5 w-3.5" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="verzonden" className="gap-1.5">
              <MailCheck className="h-3.5 w-3.5" /> Verzonden
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <LayoutTemplate className="h-3.5 w-3.5" /> Templates
            </TabsTrigger>
            <TabsTrigger value="klantberichten" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Klantberichten
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Support
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inbox">
            <EmailInbox />
          </TabsContent>
          <TabsContent value="verzonden">
            <EmailLog />
          </TabsContent>
          <TabsContent value="templates">
            <EmailTemplates />
          </TabsContent>
          <TabsContent value="klantberichten">
            <KlantBerichtenTab />
          </TabsContent>
          <TabsContent value="tickets">
            <TicketListContent />
          </TabsContent>
        </Tabs>
      ) : (
        <TicketListContent />
      )}
    </div>
  );
};

export default Berichten;
