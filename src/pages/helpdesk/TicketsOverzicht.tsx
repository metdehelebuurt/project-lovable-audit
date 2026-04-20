import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, LayoutList, KanbanSquare, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { useTickets } from "@/hooks/helpdesk/useTickets";
import { PrioriteitBadge } from "@/components/helpdesk/PrioriteitBadge";
import { StatusBadge } from "@/components/helpdesk/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_KOLOMMEN: Array<{ key: string; label: string }> = [
  { key: "nieuw", label: "Nieuw" },
  { key: "in_behandeling", label: "In behandeling" },
  { key: "wacht_op_klant", label: "Wacht op klant" },
  { key: "wacht_op_leverancier", label: "Wacht op leverancier" },
  { key: "opgelost", label: "Opgelost" },
  { key: "gesloten", label: "Gesloten" },
];

export default function TicketsOverzicht() {
  const { user } = useAuth();
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [prioFilter, setPrioFilter] = useState<string>("alle");
  const [typeFilter, setTypeFilter] = useState<string>("alle");
  const [view, setView] = useState<"lijst" | "kanban">("lijst");
  const [snel, setSnel] = useState<"alle" | "mijn" | "escalaties" | "hoog">("alle");

  const { data: tickets = [], isLoading } = useTickets({
    zoekterm: zoekterm || undefined,
    status: statusFilter !== "alle" ? statusFilter : undefined,
    prioriteit: prioFilter !== "alle" ? prioFilter : undefined,
    type: typeFilter !== "alle" ? typeFilter : undefined,
  });

  const filtered = useMemo(() => {
    let res = tickets;
    if (snel === "mijn" && user) res = res.filter((t) => t.toegewezen_aan === user.id);
    if (snel === "escalaties") res = res.filter((t) => t.is_geescaleerd);
    if (snel === "hoog") res = res.filter((t) => t.prioriteit === "hoog" || t.prioriteit === "urgent");
    return res;
  }, [tickets, snel, user]);

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

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Zoek ticketnummer, titel of omschrijving" value={zoekterm} onChange={(e) => setZoekterm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle statussen</SelectItem>
              {STATUS_KOLOMMEN.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={prioFilter} onValueChange={setPrioFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Prioriteit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle prio's</SelectItem>
              <SelectItem value="laag">Laag</SelectItem>
              <SelectItem value="normaal">Normaal</SelectItem>
              <SelectItem value="hoog">Hoog</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle types</SelectItem>
              <SelectItem value="vraag">Vraag</SelectItem>
              <SelectItem value="klacht">Klacht</SelectItem>
              <SelectItem value="storing">Storing</SelectItem>
              <SelectItem value="service_bezoek">Service-bezoek</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-1 border rounded-md p-1">
            <Toggle size="sm" pressed={view === "lijst"} onPressedChange={() => setView("lijst")} aria-label="Lijst-weergave"><LayoutList className="h-4 w-4" /></Toggle>
            <Toggle size="sm" pressed={view === "kanban"} onPressedChange={() => setView("kanban")} aria-label="Kanban-weergave"><KanbanSquare className="h-4 w-4" /></Toggle>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Filter className="h-4 w-4 text-muted-foreground self-center" />
          {([
            { k: "alle", l: "Alle" },
            { k: "mijn", l: "Mijn tickets" },
            { k: "escalaties", l: "Escalaties" },
            { k: "hoog", l: "Hoge prioriteit" },
          ] as const).map((c) => (
            <button key={c.k} type="button" onClick={() => setSnel(c.k)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${snel === c.k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
              {c.l}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} tickets</span>
        </div>
      </Card>

      {view === "lijst" ? <Card>
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
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen tickets. Maak je eerste ticket aan.</TableCell></TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs">
                  <Link to={`/helpdesk/tickets/${t.id}`} className="hover:underline flex items-center gap-1">
                    {t.ticketnummer}
                    {t.is_geescaleerd && <AlertTriangle className="h-3 w-3 text-destructive" aria-label="Geëscaleerd" />}
                  </Link>
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
      </Card> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          {STATUS_KOLOMMEN.map((kol) => {
            const items = filtered.filter((t) => t.status === kol.key);
            return (
              <Card key={kol.key} className="p-3 space-y-2 bg-muted/30 min-h-[200px]">
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                  <span>{kol.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
                {items.map((t) => (
                  <Link key={t.id} to={`/helpdesk/tickets/${t.id}`}
                    className="block bg-background rounded-md border p-2 hover:shadow-sm transition">
                    <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      {t.ticketnummer}
                      {t.is_geescaleerd && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </p>
                    <p className="text-sm font-medium line-clamp-2 mt-1">{t.titel}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <PrioriteitBadge prio={t.prioriteit} />
                    </div>
                  </Link>
                ))}
                {items.length === 0 && <p className="text-xs text-muted-foreground italic">Leeg</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}