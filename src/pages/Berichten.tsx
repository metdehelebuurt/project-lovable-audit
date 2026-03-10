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
import { Plus, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPrioritiet = Database["public"]["Enums"]["ticket_prioriteit"];

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
  created_at: string;
}

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  wacht_op_klant: "Wacht op klant",
  opgelost: "Opgelost",
  gesloten: "Gesloten",
};

const statusColors: Record<TicketStatus, string> = {
  open: "bg-primary/10 text-primary",
  in_behandeling: "bg-warning-light text-warning-foreground",
  wacht_op_klant: "bg-accent text-accent-foreground",
  opgelost: "bg-success-light text-success",
  gesloten: "bg-muted text-muted-foreground",
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
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState({
    onderwerp: "", beschrijving: "", categorie: "", prioriteit: "normaal" as TicketPrioritiet,
  });

  const isConsument = profile?.rol === "consument";

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const generateTicketNr = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TKT-${year}-${rand}`;
  };

  const handleCreate = async () => {
    if (!form.onderwerp.trim() || !form.beschrijving.trim()) {
      toast.error("Onderwerp en beschrijving zijn verplicht");
      return;
    }

    const { error } = await supabase.from("tickets").insert({
      ticketnummer: generateTicketNr(),
      onderwerp: form.onderwerp,
      beschrijving: form.beschrijving,
      categorie: form.categorie || null,
      prioriteit: form.prioriteit,
      consument_id: user!.id,
      partner_id: profile!.partner_id ?? "",
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
  };

  const filtered = tickets.filter((t) =>
    t.onderwerp.toLowerCase().includes(search.toLowerCase()) ||
    t.ticketnummer.toLowerCase().includes(search.toLowerCase())
  );

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
            <DialogHeader>
              <DialogTitle>Nieuw support ticket</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label>Onderwerp *</Label>
                <Input value={form.onderwerp} onChange={(e) => setForm({ ...form, onderwerp: e.target.value })} />
              </div>
              <div>
                <Label>Categorie</Label>
                <Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="bijv. Technisch, Factuur" />
              </div>
              <div>
                <Label>Prioriteit</Label>
                <Select value={form.prioriteit} onValueChange={(v) => setForm({ ...form, prioriteit: v as TicketPrioritiet })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(prioriteitLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Beschrijving *</Label>
                <Textarea rows={4} value={form.beschrijving} onChange={(e) => setForm({ ...form, beschrijving: e.target.value })} />
              </div>
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
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.ticketnummer}</TableCell>
                  <TableCell className="font-medium">{t.onderwerp}</TableCell>
                  <TableCell>
                    <Badge variant={t.prioriteit === "urgent" || t.prioriteit === "hoog" ? "destructive" : "secondary"}>
                      {prioriteitLabels[t.prioriteit]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as TicketStatus)}>
                      <SelectTrigger className="w-[160px]">
                        <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
