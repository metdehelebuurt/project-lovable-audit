import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LifeBuoy, Eye, Smartphone } from "lucide-react";
import { toast } from "sonner";
import InstallatieStatusBadge from "@/components/installaties/InstallatieStatusBadge";
import { INSTALLATIE_STATUS_LABELS, type InstallatieStatus } from "@/components/installaties/status";
import type { Installatie } from "@/components/installaties/api/installatieApi";

const OPEN_STATUSSEN: InstallatieStatus[] = ["gepland", "bevestigd", "onderweg", "in_uitvoering", "gereed"];
const AFGEROND_STATUSSEN: InstallatieStatus[] = ["opgeleverd", "geannuleerd"];

type FocusTab = "vandaag" | "week" | "open" | "afgerond";

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

const Installaties = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [installaties, setInstallaties] = useState<Installatie[]>([]);
  const [monteurs, setMonteurs] = useState<{ id: string; voornaam: string; achternaam: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alles");
  const [monteurFilter, setMonteurFilter] = useState<string>("alles");
  const [focusTab, setFocusTab] = useState<FocusTab>("open");

  const isInstallateur = profile?.rol === "installateur";

  useEffect(() => {
    if (isInstallateur) setFocusTab("vandaag");
  }, [isInstallateur]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("installaties")
      .select("*")
      .order("geplande_startdatum", { ascending: true, nullsFirst: false });
    if (error) toast.error(error.message);
    setInstallaties(data ?? []);

    const { data: users } = await supabase
      .from("users")
      .select("id, voornaam, achternaam")
      .eq("rol", "installateur");
    setMonteurs(users ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const weekEnd = endOfDay(new Date(now.getTime() + 6 * 86_400_000)).getTime();

    return installaties.filter((i) => {
      const ts = i.geplande_startdatum ? new Date(i.geplande_startdatum).getTime() : null;
      const status = i.status as InstallatieStatus;

      if (focusTab === "vandaag") {
        if (!ts || ts < todayStart || ts > todayEnd) return false;
        if (AFGEROND_STATUSSEN.includes(status)) return false;
      } else if (focusTab === "week") {
        if (!ts || ts < todayStart || ts > weekEnd) return false;
        if (AFGEROND_STATUSSEN.includes(status)) return false;
      } else if (focusTab === "open") {
        if (!OPEN_STATUSSEN.includes(status)) return false;
      } else if (focusTab === "afgerond") {
        if (!AFGEROND_STATUSSEN.includes(status)) return false;
      }

      if (statusFilter !== "alles" && i.status !== statusFilter) return false;
      if (monteurFilter !== "alles" && i.installateur_id !== monteurFilter) return false;
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (i.consument_naam ?? "").toLowerCase().includes(q) ||
        (i.installatienummer ?? "").toLowerCase().includes(q) ||
        (i.werkadres ?? "").toLowerCase().includes(q)
      );
    });
  }, [installaties, search, statusFilter, monteurFilter, focusTab]);

  const counts = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const weekEnd = endOfDay(new Date(now.getTime() + 6 * 86_400_000)).getTime();
    let vandaag = 0, week = 0, open = 0, afgerond = 0;
    for (const i of installaties) {
      const ts = i.geplande_startdatum ? new Date(i.geplande_startdatum).getTime() : null;
      const status = i.status as InstallatieStatus;
      const isAfgerond = AFGEROND_STATUSSEN.includes(status);
      if (ts && ts >= todayStart && ts <= todayEnd && !isAfgerond) vandaag++;
      if (ts && ts >= todayStart && ts <= weekEnd && !isAfgerond) week++;
      if (OPEN_STATUSSEN.includes(status)) open++;
      if (isAfgerond) afgerond++;
    }
    return { vandaag, week, open, afgerond };
  }, [installaties]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isInstallateur ? "Mijn werk" : "Installaties"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isInstallateur ? "Jouw geplande installaties" : "Beheer installatieopdrachten"}
          </p>
        </div>
        {!isInstallateur && (
          <Button onClick={() => navigate("/installaties/nieuw")}>
            <Plus className="h-4 w-4 mr-2" />Nieuwe installatie
          </Button>
        )}
      </div>

      <Tabs value={focusTab} onValueChange={(v) => setFocusTab(v as FocusTab)}>
        <TabsList>
          <TabsTrigger value="vandaag">Vandaag ({counts.vandaag})</TabsTrigger>
          <TabsTrigger value="week">Deze week ({counts.week})</TabsTrigger>
          <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
          <TabsTrigger value="afgerond">Afgerond ({counts.afgerond})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoek op klant, nummer of adres..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alles">Alle statussen</SelectItem>
            {Object.entries(INSTALLATIE_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isInstallateur && (
          <Select value={monteurFilter} onValueChange={setMonteurFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Monteur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alles">Alle monteurs</SelectItem>
              {monteurs.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nummer</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen installaties gevonden</TableCell></TableRow>
              ) : filtered.map((inst) => (
                <TableRow key={inst.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/installaties/${inst.id}`)}>
                  <TableCell className="font-mono text-xs">{inst.installatienummer ?? "—"}</TableCell>
                  <TableCell className="font-medium">{inst.consument_naam ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inst.werkadres ?? inst.klant_adres ?? "—"}</TableCell>
                  <TableCell><InstallatieStatusBadge status={inst.status as InstallatieStatus} /></TableCell>
                  <TableCell className="text-sm">
                    {inst.geplande_startdatum
                      ? new Date(inst.geplande_startdatum).toLocaleDateString("nl-NL")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isInstallateur && (
                      <Button variant="ghost" size="icon" asChild title="Werkscherm">
                        <Link to={`/installaties/${inst.id}/werk`} onClick={(e) => e.stopPropagation()}>
                          <Smartphone className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/installaties/${inst.id}`); }} title="Bekijken">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation();
                      const params = new URLSearchParams({ bron: "installatie", installatie_id: inst.id });
                      if (inst.lead_id) params.set("lead_id", inst.lead_id);
                      if (inst.consument_id) params.set("klant_id", inst.consument_id);
                      navigate(`/helpdesk/tickets/nieuw?${params.toString()}`);
                    }} title="Ticket aanmaken">
                      <LifeBuoy className="h-4 w-4" />
                    </Button>
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

export default Installaties;