import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Plus, Search, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

type Keuring = {
  id: string;
  keuringnummer: string | null;
  type: "zonnepanelen" | "thuisbatterij" | "combi";
  status: "gepland" | "in_uitvoering" | "afgerond" | "achterstallig" | "geannuleerd";
  geplande_datum: string;
  uitgevoerd_op: string | null;
  klant_id: string | null;
  installatie_id: string | null;
  object_omschrijving: string | null;
  locatie_plaats: string | null;
  resultaat: string | null;
  klant?: { voornaam?: string | null; achternaam?: string | null; bedrijfsnaam?: string | null; plaats?: string | null } | null;
};

const STATUS_LABELS: Record<Keuring["status"], string> = {
  gepland: "Gepland",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  achterstallig: "Achterstallig",
  geannuleerd: "Geannuleerd",
};

const STATUS_COLORS: Record<Keuring["status"], string> = {
  gepland: "bg-primary/10 text-primary",
  in_uitvoering: "bg-warning-light text-warning-foreground",
  afgerond: "bg-success-light text-success",
  achterstallig: "bg-error-light text-error",
  geannuleerd: "bg-muted text-muted-foreground",
};

const TYPE_LABELS: Record<Keuring["type"], string> = {
  zonnepanelen: "Zonnepanelen",
  thuisbatterij: "Thuisbatterij",
  combi: "Combi (PV + batterij)",
};

type Tab = "open" | "achterstallig" | "afgerond" | "alles";

const Keuringen = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Keuring[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("alle");
  const [tab, setTab] = useState<Tab>("open");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("keuringen" as any)
      .select("id, keuringnummer, type, status, geplande_datum, uitgevoerd_op, klant_id, installatie_id, object_omschrijving, locatie_plaats, resultaat")
      .order("geplande_datum", { ascending: true });
    if (error) {
      toast.error(error.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as any[];
    const klantIds = Array.from(new Set(rows.map((r) => r.klant_id).filter(Boolean)));
    let klantMap = new Map<string, any>();
    if (klantIds.length > 0) {
      const { data: klanten } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, bedrijfsnaam, plaats")
        .in("id", klantIds);
      klantMap = new Map((klanten ?? []).map((k: any) => [k.id, k]));
    }
    setItems(rows.map((r) => ({ ...r, klant: r.klant_id ? klantMap.get(r.klant_id) ?? null : null })));
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, []);

  const klantNaam = (k: Keuring): string => {
    if (k.klant?.bedrijfsnaam) return k.klant.bedrijfsnaam;
    const n = `${k.klant?.voornaam ?? ""} ${k.klant?.achternaam ?? ""}`.trim();
    return n || k.object_omschrijving || "—";
  };

  const filtered = useMemo(() => {
    return items.filter((k) => {
      if (tab === "open" && !["gepland", "in_uitvoering"].includes(k.status)) return false;
      if (tab === "achterstallig" && k.status !== "achterstallig") return false;
      if (tab === "afgerond" && k.status !== "afgerond") return false;
      if (typeFilter !== "alle" && k.type !== typeFilter) return false;
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        klantNaam(k).toLowerCase().includes(q) ||
        (k.keuringnummer ?? "").toLowerCase().includes(q) ||
        (k.locatie_plaats ?? k.klant?.plaats ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, tab, typeFilter, search]);

  const counts = useMemo(() => ({
    open: items.filter((k) => ["gepland", "in_uitvoering"].includes(k.status)).length,
    achterstallig: items.filter((k) => k.status === "achterstallig").length,
    afgerond: items.filter((k) => k.status === "afgerond").length,
    alles: items.length,
  }), [items]);

  const canCreate = profile && ["superadmin", "partner_admin", "partner_staff", "adviseur", "backoffice"].includes(profile.rol);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Periodieke keuringen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inspecties zonnepanelen en thuisbatterijen conform NEN 1010, NEN 3140 en Scope 12.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/keuringen/nieuw")} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuwe keuring
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Clock} label="Open" value={counts.open} tone="primary" />
        <KpiCard icon={AlertTriangle} label="Achterstallig" value={counts.achterstallig} tone="error" />
        <KpiCard icon={CheckCircle2} label="Afgerond" value={counts.afgerond} tone="success" />
        <KpiCard icon={ShieldCheck} label="Totaal" value={counts.alles} tone="muted" />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="md:flex-1">
              <TabsList>
                <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
                <TabsTrigger value="achterstallig">Achterstallig ({counts.achterstallig})</TabsTrigger>
                <TabsTrigger value="afgerond">Afgerond ({counts.afgerond})</TabsTrigger>
                <TabsTrigger value="alles">Alles</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 h-9"
                  placeholder="Zoek op klant, nummer of plaats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle types</SelectItem>
                  <SelectItem value="zonnepanelen">Zonnepanelen</SelectItem>
                  <SelectItem value="thuisbatterij">Thuisbatterij</SelectItem>
                  <SelectItem value="combi">Combi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Klant / object</TableHead>
                  <TableHead>Plaats</TableHead>
                  <TableHead>Geplande datum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Geen keuringen gevonden.{canCreate && <> <Link to="/keuringen/nieuw" className="text-primary underline">Nieuwe keuring aanmaken</Link>.</>}
                  </TableCell></TableRow>
                ) : filtered.map((k) => (
                  <TableRow
                    key={k.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate(`/keuringen/${k.id}`)}
                  >
                    <TableCell className="font-medium">{k.keuringnummer ?? "—"}</TableCell>
                    <TableCell>{TYPE_LABELS[k.type]}</TableCell>
                    <TableCell>{klantNaam(k)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{k.locatie_plaats ?? k.klant?.plaats ?? "—"}</TableCell>
                    <TableCell className="text-sm">{new Date(k.geplande_datum).toLocaleDateString("nl-NL")}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[k.status]}>{STATUS_LABELS[k.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function KpiCard({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: number; tone: "primary" | "error" | "success" | "muted" }) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    error: "bg-error-light text-error",
    success: "bg-success-light text-success",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Keuringen;