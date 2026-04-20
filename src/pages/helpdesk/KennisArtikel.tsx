import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useKennisArtikel } from "@/hooks/helpdesk/useKennisbank";

export default function KennisArtikel() {
  const { id } = useParams<{ id: string }>();
  const { data: a, isLoading } = useKennisArtikel(id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Laden…</p>;
  if (!a) return <p className="text-sm text-muted-foreground">Artikel niet gevonden.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/helpdesk/kennisbank"><ArrowLeft className="h-4 w-4 mr-2" />Terug</Link></Button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          {a.status !== "gepubliceerd" && <Badge variant="outline">{a.status}</Badge>}
          {a.ai_gegenereerd && <Badge variant="secondary">AI-gegenereerd</Badge>}
        </div>
        <h1 className="text-2xl font-semibold">{a.titel}</h1>
        {a.samenvatting && <p className="text-muted-foreground mt-2">{a.samenvatting}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {a.product_merk && <Badge variant="secondary">{a.product_merk}</Badge>}
        {a.product_categorie && <Badge variant="secondary">{a.product_categorie}</Badge>}
        {a.product_type && <Badge variant="secondary">{a.product_type}</Badge>}
        {a.foutcode && <Badge variant="outline">Foutcode {a.foutcode}</Badge>}
      </div>

      {a.probleem && (
        <Card className="p-6">
          <h2 className="font-semibold mb-2">Probleem</h2>
          <p className="text-sm whitespace-pre-wrap">{a.probleem}</p>
        </Card>
      )}
      {a.oplossing && (
        <Card className="p-6">
          <h2 className="font-semibold mb-2">Oplossing</h2>
          <p className="text-sm whitespace-pre-wrap">{a.oplossing}</p>
        </Card>
      )}
    </div>
  );
}