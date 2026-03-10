import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-2">Binnenkort beschikbaar</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Deze pagina wordt in de volgende fase gebouwd.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default PlaceholderPage;
