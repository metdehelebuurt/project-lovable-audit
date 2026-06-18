import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, MessageSquare, Lightbulb, Bug, TrendingUp, AlertCircle, Settings,
} from "lucide-react";

const categorieIcons: Record<string, React.ElementType> = {
  ui: MessageSquare, performance: TrendingUp, nieuwe_functie: Lightbulb,
  bug: Bug, integratie: Sparkles, workflow: AlertCircle, overig: MessageSquare,
};

const statusOptions = [
  { value: "nieuw", label: "Nieuw" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "gepland", label: "Gepland" },
  { value: "afgerond", label: "Afgerond" },
  { value: "afgewezen", label: "Afgewezen" },
];

const prioriteitKleur: Record<string, string> = {
  laag: "text-muted-foreground",
  normaal: "text-foreground",
  hoog: "text-amber-600",
  kritiek: "text-destructive",
};

export default function FeedbackAdmin() {
  const navigate = useNavigate();
  const [filterCat, setFilterCat] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["feedback_admin", filterCat, filterStatus],
    queryFn: async () => {
      let q = supabase
        .from("feedback_verzoeken")
        .select("*")
        .order("stemmen", { ascending: false });
      if (filterCat !== "alle") q = q.eq("categorie", filterCat);
      if (filterStatus !== "alle") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    total: items.length,
    nieuw: items.filter((i: any) => i.status === "nieuw").length,
    bugs: items.filter((i: any) => i.categorie === "bug").length,
    hoog: items.filter((i: any) => i.prioriteit === "hoog" || i.prioriteit === "kritiek").length,
    categories: Object.entries(
      items.reduce((acc: Record<string, number>, i: any) => {
        acc[i.categorie] = (acc[i.categorie] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => (b[1] as number) - (a[1] as number)),
  };

  const generateAiReport = async () => {
    setAiLoading(true);
    try {
      const categoryBreakdown = stats.categories
        .map(([cat, count]) => `${cat}: ${count}`)
        .join(", ");
      const topItems = items
        .slice(0, 5)
        .map((i: any) => `• ${i.titel} (${i.stemmen} stemmen, ${i.categorie})`)
        .join("\n");
      setAiReport(
        `## Feedback Analyse Rapport\n\n**Totaal:** ${stats.total} items | **Nieuw:** ${stats.nieuw} | **Bugs:** ${stats.bugs}\n\n**Verdeling per categorie:** ${categoryBreakdown}\n\n**Meest gevraagd:**\n${topItems}`,
      );
    } catch {
      toast.error("Fout bij genereren rapport");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Feedback Beheer</h1>
          <p className="text-muted-foreground">
            Overzicht en beheer van alle feedback en functieverzoeken
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateAiReport} disabled={aiLoading} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? "Analyseren..." : "AI Rapport"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/feedback/notificatie-instellingen">
              <Settings className="h-4 w-4 mr-2" />
              Meldinginstellingen
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Totaal</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.nieuw}</p>
          <p className="text-xs text-muted-foreground">Nieuw</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.bugs}</p>
          <p className="text-xs text-muted-foreground">Bugs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.hoog}</p>
          <p className="text-xs text-muted-foreground">Hoge prioriteit</p>
        </CardContent></Card>
      </div>

      {aiReport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
              {aiReport}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle categorieën</SelectItem>
            <SelectItem value="ui">UI/UX</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="nieuwe_functie">Nieuwe functie</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="integratie">Integratie</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="overig">Overig</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Geen feedback gevonden met de huidige filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => {
            const Icon = categorieIcons[item.categorie] || MessageSquare;
            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/feedback/admin/${item.id}`)}
              >
                <CardContent className="py-3 flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-sm font-bold">{item.stemmen || 0}</span>
                    <span className="text-[10px] text-muted-foreground">stemmen</span>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.titel}</span>
                      <Badge
                        variant={item.type === "functieverzoek" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {item.type === "functieverzoek" ? "Verzoek" : "Feedback"}
                      </Badge>
                    </div>
                    {item.ai_samenvatting && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.ai_samenvatting.split("\n")[0]}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {statusOptions.find((s) => s.value === item.status)?.label || item.status}
                  </Badge>
                  <span className={`text-xs font-medium shrink-0 ${prioriteitKleur[item.prioriteit] || ""}`}>
                    {item.prioriteit}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(item.created_at).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
