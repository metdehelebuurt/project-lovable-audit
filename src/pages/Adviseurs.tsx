import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, TrendingUp, FileText, ClipboardCheck, Euro, ArrowLeft, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { subDays, subMonths, startOfMonth, format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

const periodeOpties = [
  { value: "week", label: "Afgelopen week" },
  { value: "maand", label: "Afgelopen maand" },
  { value: "kwartaal", label: "Afgelopen kwartaal" },
  { value: "jaar", label: "Afgelopen jaar" },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const Adviseurs = () => {
  const { profile } = useAuth();
  const [periode, setPeriode] = useState("maand");
  const [selectedAdviseur, setSelectedAdviseur] = useState<UserRow | null>(null);

  const sinceDate = useMemo(() => {
    const now = new Date();
    switch (periode) {
      case "week": return subDays(now, 7).toISOString();
      case "maand": return subMonths(now, 1).toISOString();
      case "kwartaal": return subMonths(now, 3).toISOString();
      case "jaar": return subMonths(now, 12).toISOString();
      default: return subMonths(now, 1).toISOString();
    }
  }, [periode]);

  const { data: adviseurs = [] } = useQuery({
    queryKey: ["adviseurs-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("rol", "adviseur")
        .eq("status", "actief")
        .order("voornaam");
      if (error) throw error;
      return data as UserRow[];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["adviseur-leads", sinceDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, owner_user_id, lead_status, created_at")
        .gte("created_at", sinceDate);
      if (error) throw error;
      return data;
    },
  });

  const { data: schouwen = [] } = useQuery({
    queryKey: ["adviseur-schouwen", sinceDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schouwen")
        .select("id, adviseur_id, status, created_at")
        .gte("created_at", sinceDate);
      if (error) throw error;
      return data;
    },
  });

  const { data: offertes = [] } = useQuery({
    queryKey: ["adviseur-offertes", sinceDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offertes")
        .select("id, adviseur_id, status, totaal_bedrag, created_at")
        .gte("created_at", sinceDate);
      if (error) throw error;
      return data;
    },
  });

  // KPI per adviseur
  const adviseurStats = useMemo(() => {
    return adviseurs.map((a) => {
      const aLeads = leads.filter((l) => l.owner_user_id === a.id);
      const aSchouwen = schouwen.filter((s) => s.adviseur_id === a.id);
      const aOffertes = offertes.filter((o) => o.adviseur_id === a.id);
      const geaccepteerd = aOffertes.filter((o) => o.status === "geaccepteerd");
      const omzet = geaccepteerd.reduce((sum, o) => sum + Number(o.totaal_bedrag), 0);
      const conversie = aOffertes.length > 0 ? (geaccepteerd.length / aOffertes.length) * 100 : 0;

      return {
        ...a,
        aantalLeads: aLeads.length,
        aantalSchouwen: aSchouwen.length,
        aantalOffertes: aOffertes.length,
        aantalGeaccepteerd: geaccepteerd.length,
        omzet,
        conversie,
      };
    });
  }, [adviseurs, leads, schouwen, offertes]);

  // Totals
  const totals = useMemo(() => {
    const totalLeads = leads.length;
    const totalSchouwen = schouwen.length;
    const totalOffertes = offertes.length;
    const totalGeaccepteerd = offertes.filter((o) => o.status === "geaccepteerd").length;
    const totalOmzet = offertes
      .filter((o) => o.status === "geaccepteerd")
      .reduce((sum, o) => sum + Number(o.totaal_bedrag), 0);
    const conversie = totalOffertes > 0 ? (totalGeaccepteerd / totalOffertes) * 100 : 0;
    return { totalLeads, totalSchouwen, totalOffertes, totalGeaccepteerd, totalOmzet, conversie };
  }, [leads, schouwen, offertes]);

  // Chart data for selected adviseur
  const chartData = useMemo(() => {
    if (!selectedAdviseur) return [];
    const aOffertes = offertes.filter((o) => o.adviseur_id === selectedAdviseur.id);
    const months: Record<string, { maand: string; offertes: number; geaccepteerd: number }> = {};

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(new Date(), i));
      const key = format(d, "yyyy-MM");
      months[key] = { maand: format(d, "MMM", { locale: nl }), offertes: 0, geaccepteerd: 0 };
    }

    aOffertes.forEach((o) => {
      const key = format(parseISO(o.created_at), "yyyy-MM");
      if (months[key]) {
        months[key].offertes += 1;
        if (o.status === "geaccepteerd") months[key].geaccepteerd += 1;
      }
    });

    return Object.values(months);
  }, [selectedAdviseur, offertes]);

  const selectedStats = selectedAdviseur
    ? adviseurStats.find((a) => a.id === selectedAdviseur.id)
    : null;

  const kpiCards = [
    { label: "Leads", value: totals.totalLeads, icon: Users, color: "text-primary" },
    { label: "Schouwen", value: totals.totalSchouwen, icon: ClipboardCheck, color: "text-accent-foreground" },
    { label: "Offertes", value: totals.totalOffertes, icon: FileText, color: "text-primary" },
    { label: "Conversie", value: `${totals.conversie.toFixed(0)}%`, icon: TrendingUp, color: "text-success" },
    { label: "Omzet", value: formatCurrency(totals.totalOmzet), icon: Euro, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Adviseurs</h1>
          <p className="text-muted-foreground mt-1">Prestatie-overzicht per adviseur</p>
        </div>
        <Select value={periode} onValueChange={setPeriode}>
          <SelectTrigger className="w-52 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodeOpties.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Adviseurs tabel */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Adviseurs prestaties</CardTitle>
        </CardHeader>
        <CardContent>
          {adviseurs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen adviseurs gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adviseur</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Schouwen</TableHead>
                    <TableHead className="text-center">Offertes</TableHead>
                    <TableHead className="text-center">Geaccepteerd</TableHead>
                    <TableHead className="text-center">Conversie</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adviseurStats.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.voornaam} {a.achternaam}</TableCell>
                      <TableCell className="text-center">{a.aantalLeads}</TableCell>
                      <TableCell className="text-center">{a.aantalSchouwen}</TableCell>
                      <TableCell className="text-center">{a.aantalOffertes}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-success-light text-success">{a.aantalGeaccepteerd}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{a.conversie.toFixed(0)}%</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(a.omzet)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedAdviseur(a)} title="Detail">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selectedAdviseur} onOpenChange={(open) => !open && setSelectedAdviseur(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedAdviseur(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {selectedAdviseur?.voornaam} {selectedAdviseur?.achternaam}
            </DialogTitle>
          </DialogHeader>
          {selectedStats && (
            <div className="space-y-6">
              {/* Mini KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Leads</p>
                  <p className="text-xl font-bold">{selectedStats.aantalLeads}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Schouwen</p>
                  <p className="text-xl font-bold">{selectedStats.aantalSchouwen}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Conversie</p>
                  <p className="text-xl font-bold">{selectedStats.conversie.toFixed(0)}%</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Omzet</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedStats.omzet)}</p>
                </div>
              </div>

              {/* Chart */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Offertes per maand (laatste 6 maanden)</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="maand" className="text-xs fill-muted-foreground" />
                      <YAxis allowDecimals={false} className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="offertes" name="Offertes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="geaccepteerd" name="Geaccepteerd" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Adviseurs;
