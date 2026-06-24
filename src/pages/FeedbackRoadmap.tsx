import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThumbsUp, Lightbulb, MessageSquareText, Bug, Star } from "lucide-react";
import { CATEGORIE_OPTIES, STATUS_KLEUR, type FeedbackStatus } from "@/lib/feedback/constants";

type RoadmapItem = {
  id: string;
  titel: string;
  type: string;
  status: string;
  categorie: string | null;
  stemmen: number | null;
  ai_samenvatting: string | null;
  csat_score: number | null;
  verwacht_klaar_op: string | null;
  verwerkt_in_versie: string | null;
  created_at: string;
};

const KOLOMMEN: Array<{ status: FeedbackStatus; titel: string; omschrijving: string }> = [
  { status: "nieuw", titel: "Ontvangen", omschrijving: "Net binnengekomen en in afwachting van triage." },
  { status: "in_behandeling", titel: "In behandeling", omschrijving: "Wordt actief opgepakt." },
  { status: "gepland", titel: "Gepland", omschrijving: "Staat in de planning voor uitvoering." },
  { status: "in_review", titel: "In review", omschrijving: "Wacht op terugkoppeling van de indiener." },
  { status: "afgerond", titel: "Live", omschrijving: "Beschikbaar in het platform." },
];

const CATEGORIE_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIE_OPTIES.map((c) => [c.value, c.label]),
);

export default function FeedbackRoadmap() {
  const [categorie, setCategorie] = useState<string>("alle");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["feedback_roadmap_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_verzoeken")
        .select(
          "id, titel, type, status, categorie, stemmen, ai_samenvatting, csat_score, verwacht_klaar_op, verwerkt_in_versie, created_at",
        )
        .eq("gearchiveerd", false)
        .neq("status", "afgewezen")
        .order("stemmen", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RoadmapItem[];
    },
  });

  const gefilterd = useMemo(
    () => (categorie === "alle" ? items : items.filter((i) => i.categorie === categorie)),
    [items, categorie],
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Productroadmap</h1>
            <p className="text-sm text-muted-foreground">
              Bekijk de voortgang van feedback en functieverzoeken.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/feedback/nieuw">Nieuw verzoek</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/feedback">Inloggen</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={categorie} onValueChange={setCategorie}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle categorieën</SelectItem>
              {CATEGORIE_OPTIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {gefilterd.length} item{gefilterd.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Laden…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {KOLOMMEN.map((kolom) => {
              const kItems = gefilterd.filter((i) => i.status === kolom.status);
              return (
                <section key={kolom.status} className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-sm">{kolom.titel}</h2>
                      <Badge variant="outline" className={`${STATUS_KLEUR[kolom.status]} border-transparent`}>
                        {kItems.length}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{kolom.omschrijving}</p>
                  </div>
                  <div className="space-y-2">
                    {kItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Geen items.</p>
                    ) : (
                      kItems.map((i) => <RoadmapKaart key={i.id} item={i} />)
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function RoadmapKaart({ item }: { item: RoadmapItem }) {
  const Icon =
    item.categorie === "bug"
      ? Bug
      : item.type === "functieverzoek"
      ? Lightbulb
      : MessageSquareText;
  return (
    <Card>
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p className="text-sm font-medium leading-snug">{item.titel}</p>
        </div>
        {item.ai_samenvatting && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.ai_samenvatting.split("\n")[0]}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {item.categorie && (
            <Badge variant="outline" className="capitalize">
              {CATEGORIE_LABEL[item.categorie] ?? item.categorie}
            </Badge>
          )}
          {item.verwerkt_in_versie && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              v{item.verwerkt_in_versie}
            </Badge>
          )}
          {item.verwacht_klaar_op && item.status !== "afgerond" && (
            <span className="text-muted-foreground">
              ETA {new Date(item.verwacht_klaar_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" /> {item.stemmen ?? 0}
          </span>
          {typeof item.csat_score === "number" && item.csat_score > 0 && (
            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {item.csat_score}/5
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}