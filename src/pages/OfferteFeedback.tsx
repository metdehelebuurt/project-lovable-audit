import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BarChart3, PieChart as PieChartIcon, TrendingDown, Brain, Loader2, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import DOMPurify from "dompurify";

const categorieLabels: Record<string, string> = {
  prijs: "Prijs te hoog",
  concurrent: "Concurrent gekozen",
  geen_behoefte: "Geen behoefte meer",
  timing: "Timing niet goed",
  overig: "Overig",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export default function OfferteFeedback() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [aiRapport, setAiRapport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch all offertes for stats
  const { data: alleOffertes = [] } = useQuery({
    queryKey: ["offertes-feedback-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offertes")
        .select("id, offertenummer, klant_naam, totaal_bedrag, status, afwijzing_reden, afwijzing_categorie, updated_at, created_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const afgewezen = useMemo(() =>
    alleOffertes.filter((o: any) => o.status === "afgewezen" || o.status === "verlopen"),
    [alleOffertes]
  );

  const verzonden = useMemo(() =>
    alleOffertes.filter((o: any) => ["verzonden", "geaccepteerd", "afgewezen", "verlopen"].includes(o.status)),
    [alleOffertes]
  );

  const geaccepteerd = useMemo(() =>
    alleOffertes.filter((o: any) => o.status === "geaccepteerd"),
    [alleOffertes]
  );

  // Stats
  const totaalAfgewezen = afgewezen.length;
  const conversieRatio = verzonden.length > 0 ? ((geaccepteerd.length / verzonden.length) * 100).toFixed(1) : "0";
  const gemiddeldeBedrag = totaalAfgewezen > 0
    ? afgewezen.reduce((sum: number, o: any) => sum + (o.totaal_bedrag || 0), 0) / totaalAfgewezen
    : 0;

  // Category distribution
  const categorieCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    afgewezen.forEach((o: any) => {
      const cat = o.afwijzing_categorie || "onbekend";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: categorieLabels[name] || name,
      value,
    }));
  }, [afgewezen]);

  // Most common reason
  const meestVoorkomend = categorieCounts.length > 0
    ? categorieCounts.reduce((a, b) => a.value > b.value ? a : b).name
    : "—";

  // Monthly trend
  const maandTrend = useMemo(() => {
    const months: Record<string, number> = {};
    afgewezen.forEach((o: any) => {
      const d = new Date(o.updated_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        maand: new Date(month + "-01").toLocaleDateString("nl-NL", { month: "short", year: "2-digit" }),
        afwijzingen: count,
      }));
  }, [afgewezen]);

  const handleGenerateRapport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-offerte-feedback-analyse");
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setAiRapport(data.rapport);
      }
    } catch (e: any) {
      toast.error("Rapport genereren mislukt", { description: e.message });
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/offertes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Offerte Feedback & Analyse</h1>
          <p className="text-muted-foreground text-sm">Inzicht in afwijzingsredenen en conversie-optimalisatie</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Totaal afgewezen</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totaalAfgewezen}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Conversieratio</p>
            <p className="text-3xl font-bold text-foreground mt-1">{conversieRatio}%</p>
            <p className="text-xs text-muted-foreground">{geaccepteerd.length} van {verzonden.length} verzonden</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Gem. bedrag bij afwijzing</p>
            <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(gemiddeldeBedrag)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Meest voorkomende reden</p>
            <p className="text-lg font-bold text-foreground mt-1">{meestVoorkomend}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-muted-foreground" /> Verdeling afwijzingscategorieën
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categorieCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categorieCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categorieCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Geen data beschikbaar</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" /> Afwijzingen per maand
            </CardTitle>
          </CardHeader>
          <CardContent>
            {maandTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={maandTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="maand" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="afwijzingen" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Geen data beschikbaar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Rapport */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" /> AI-analyse rapport
            </CardTitle>
            <Button onClick={handleGenerateRapport} disabled={generating} className="rounded-pill gap-2" size="sm">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {generating ? "Genereren..." : "Genereer analyse"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiRapport ? (
            <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiRapport.replace(/\n/g, "<br/>").replace(/## /g, "<h3>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")) }} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Klik op "Genereer analyse" om een AI-rapport te genereren op basis van de afwijzingsredenen van de laatste 90 dagen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Afgewezen offertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offertenummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {afgewezen.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Geen afgewezen offertes gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  afgewezen.map((o: any) => (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/offertes/${o.id}`)}>
                      <TableCell className="font-medium">{o.offertenummer}</TableCell>
                      <TableCell>{o.klant_naam}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.totaal_bedrag)}</TableCell>
                      <TableCell>
                        {o.afwijzing_categorie ? (
                          <Badge variant="outline" className="text-xs">{categorieLabels[o.afwijzing_categorie] || o.afwijzing_categorie}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{o.afwijzing_reden || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={o.status === "afgewezen" ? "text-destructive border-destructive/30" : "text-warning-foreground border-warning/30"}>
                          {o.status === "afgewezen" ? "Afgewezen" : "Verlopen"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(o.updated_at).toLocaleDateString("nl-NL")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
