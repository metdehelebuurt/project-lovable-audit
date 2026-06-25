import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import type { AffiliateTemplate } from "@/lib/affiliateTemplates/registry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIE_LABELS, type ActieKey } from "@/lib/email/actieDefault";
import { useAffiliateEmailTemplates, type AffiliateEmailTemplateRow } from "@/hooks/affiliate/useAffiliateEmailTemplates";
import { toast } from "sonner";

interface Props {
  template: AffiliateTemplate;
  row: AffiliateEmailTemplateRow | null;
  allRows: Record<string, AffiliateEmailTemplateRow> | undefined;
  onOpen: () => void;
}

const ACTIES: ActieKey[] = ["demo_klant","demo_collega","terugbel_klant","terugbel_collega","trial_klant"];

export function TemplateKaart({ template, row, allRows, onOpen }: Props) {
  const aangepast = !!row;
  const { upsert } = useAffiliateEmailTemplates();
  const huidigeActie = (row?.actie_default ?? "geen") as ActieKey | "geen";

  const wijzigActie = async (next: string) => {
    const target = next === "geen" ? null : (next as ActieKey);
    // Voorkom dat twee templates dezelfde actie claimen — waarschuw als nodig.
    if (target && allRows) {
      const conflict = Object.values(allRows).find(
        (r) => r.actie_default === target && r.template_key !== template.key,
      );
      if (conflict) {
        toast.info(`Standaard verplaatst van '${conflict.template_key}' naar '${template.key}'`);
      }
    }
    await upsert.mutateAsync({
      template_key: template.key,
      onderwerp: row?.onderwerp ?? template.defaultOnderwerp,
      body_html: row?.body_html ?? template.defaultBodyHtml,
      afzender_naam: row?.afzender_naam ?? null,
      actief: row?.actief ?? true,
      actie_default: target,
    });
  };

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
        <div className="space-y-1">
          <p className="text-xs font-medium">Gebruiken als standaard voor</p>
          <Select value={huidigeActie} onValueChange={wijzigActie}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geen">— niet gekoppeld —</SelectItem>
              {ACTIES.map((a) => (
                <SelectItem key={a} value={a}>{ACTIE_LABELS[a]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={onOpen}>
          <Pencil className="h-4 w-4 mr-1.5" /> Bewerken
        </Button>
      </CardContent>
    </Card>
  );
}
