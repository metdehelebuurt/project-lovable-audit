import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { useGenereerBedrijfSamenvatting } from "@/hooks/affiliate/useBedrijfSamenvatting";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

type Kans = { titel: string; uitleg: string };

type Props = { lead: AffiliateLead };

export function BedrijfSamenvattingKaart({ lead }: Props) {
  const genereer = useGenereerBedrijfSamenvatting();
  const heeft = !!lead.ai_bedrijf_samenvatting;
  const kansen = (lead.ai_bedrijf_kansen as Kans[] | null) ?? [];
  const datum = lead.ai_bedrijf_samenvatting_op
    ? new Date(lead.ai_bedrijf_samenvatting_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
    : null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI bedrijfsanalyse
          {datum && <Badge variant="outline" className="text-xs">{datum}</Badge>}
        </CardTitle>
        <Button
          size="sm"
          variant={heeft ? "ghost" : "default"}
          onClick={() => genereer.mutate(lead.id)}
          disabled={genereer.isPending}
          className="gap-1"
        >
          {genereer.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : heeft ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {genereer.isPending ? "Bezig…" : heeft ? "Vernieuwen" : "Genereer"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!heeft && !genereer.isPending && (
          <p className="text-muted-foreground italic">
            Klik op <strong>Genereer</strong> voor een AI-samenvatting van dit bedrijf met concrete sales-kansen.
          </p>
        )}
        {heeft && <p className="whitespace-pre-wrap">{lead.ai_bedrijf_samenvatting}</p>}
        {heeft && kansen.length > 0 && (
          <ul className="space-y-2 pt-1">
            {kansen.map((k, i) => (
              <li key={i} className="flex gap-2 border-t pt-2">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{k.titel}</p>
                  <p className="text-muted-foreground text-xs">{k.uitleg}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default BedrijfSamenvattingKaart;