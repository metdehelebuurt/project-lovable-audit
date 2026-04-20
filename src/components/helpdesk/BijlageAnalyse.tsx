import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Analyse {
  samenvatting?: string;
  bevindingen?: string[];
  vermoedelijke_oorzaak?: string;
  aanbevelingen?: string[];
}

export function BijlageAnalyse({
  ticketId,
  partnerId,
  bijlageId,
  bestandUrl,
  mimeType,
}: {
  ticketId: string;
  partnerId: string;
  bijlageId: string;
  bestandUrl: string;
  mimeType: string | null;
}) {
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [bezig, setBezig] = useState(false);

  const start = async () => {
    setBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("helpdesk-ai-analyze-bijlage", {
        body: {
          ticket_id: ticketId,
          partner_id: partnerId,
          bijlage_id: bijlageId,
          bestand_url: bestandUrl,
          mime_type: mimeType,
        },
      });
      if (error) throw error;
      setAnalyse((data as { analyse: Analyse }).analyse);
    } catch (e) {
      toast.error(`Analyse mislukt: ${(e as Error).message}`);
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <Button size="sm" variant="outline" onClick={start} disabled={bezig}>
        {bezig ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
        AI analyse
      </Button>
      {analyse ? (
        <div className="text-sm border rounded-md p-3 bg-muted/30 space-y-2">
          {analyse.samenvatting ? <p>{analyse.samenvatting}</p> : null}
          {analyse.bevindingen?.length ? (
            <div>
              <p className="font-medium text-xs">Bevindingen</p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {analyse.bevindingen.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ) : null}
          {analyse.vermoedelijke_oorzaak ? (
            <p className="text-xs"><span className="font-medium">Vermoedelijke oorzaak:</span> {analyse.vermoedelijke_oorzaak}</p>
          ) : null}
          {analyse.aanbevelingen?.length ? (
            <div>
              <p className="font-medium text-xs">Aanbevelingen</p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {analyse.aanbevelingen.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}