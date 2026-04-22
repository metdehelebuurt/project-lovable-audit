import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, BookOpen, ExternalLink, FileText } from "lucide-react";
import { fetchHandleidingenVoorInstallatie, type Handleiding } from "@/lib/productHandleidingen";

interface Props {
  installatieId: string;
  /** Wanneer true: alleen installatiehandleidingen tonen (monteur-context). */
  alleenInstallatie?: boolean;
}

export default function InstallatieDocumentatieCard({ installatieId, alleenInstallatie = true }: Props) {
  const { data: handleidingen = [], isLoading } = useQuery({
    queryKey: ["installatie-handleidingen", installatieId, alleenInstallatie],
    queryFn: async () => {
      const all = await fetchHandleidingenVoorInstallatie(installatieId);
      return alleenInstallatie ? all.filter((h) => h.type === "installatie") : all;
    },
    enabled: !!installatieId,
  });

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" /> Documentatie monteur
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : handleidingen.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Geen installatiehandleidingen gevonden bij de gekoppelde producten.
          </p>
        ) : (
          <ul className="space-y-2">
            {handleidingen.map((h) => (
              <HandleidingItem key={`${h.product_id}-${h.type}`} item={h} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function HandleidingItem({ item }: { item: Handleiding }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <FileText className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product_naam}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px] gap-1">
            {item.type === "installatie" ? <Wrench className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
            {item.type === "installatie" ? "Installatie" : "Gebruiker"}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">{item.bestandsnaam}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild className="gap-1.5 shrink-0">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </a>
      </Button>
    </li>
  );
}