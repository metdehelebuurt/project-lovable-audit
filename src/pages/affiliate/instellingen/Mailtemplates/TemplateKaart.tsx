import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import type { AffiliateTemplate } from "@/lib/affiliateTemplates/registry";

interface Props {
  template: AffiliateTemplate;
  aangepast: boolean;
  onOpen: () => void;
}

export function TemplateKaart({ template, aangepast, onOpen }: Props) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{template.displayName}</CardTitle>
          {aangepast ? (
            <Badge variant="default" className="bg-primary/15 text-primary hover:bg-primary/20">Aangepast</Badge>
          ) : (
            <Badge variant="outline">Standaard</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">{template.beschrijving}</p>
        <p className="text-xs text-muted-foreground"><strong>Trigger:</strong> {template.trigger}</p>
        <Button size="sm" variant="outline" onClick={onOpen}>
          <Pencil className="h-4 w-4 mr-1.5" /> Bewerken
        </Button>
      </CardContent>
    </Card>
  );
}
