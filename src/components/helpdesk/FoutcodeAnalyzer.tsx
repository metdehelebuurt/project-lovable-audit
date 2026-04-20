import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

interface Stap { stap: number; actie: string; verwacht_resultaat: string }
interface Analyse {
  betekenis?: string;
  waarschijnlijke_oorzaken?: string[];
  oplossingsstappen?: Stap[];
  veiligheid?: string;
  wanneer_monteur?: string;
}

export function FoutcodeAnalyzer({ ticket, userId }: { ticket: HelpdeskTicket; userId: string }) {
  const [merk, setMerk] = useState(ticket.product_merk ?? "");
  const [foutcode, setFoutcode] = useState(ticket.foutcode ?? "");
  const [context, setContext] = useState("");
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [bezig, setBezig] = useState(false);

  const start = async () => {
    if (!merk.trim() || !foutcode.trim()) {
      toast.error("Vul merk en foutcode in");
      return;
    }
    setBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("helpdesk-ai-foutcode", {
        body: {
          ticket_id: ticket.id,
          partner_id: ticket.partner_id,
          user_id: userId,
          merk,
          foutcode,
          product_categorie: ticket.product_categorie,
          product_type: ticket.product_type,
          context,
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
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold">Foutcode Analyzer</h3>
        <p className="text-sm text-muted-foreground">AI zoekt betekenis en oplossingsstappen op basis van merk en foutcode.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label htmlFor="fc-merk">Merk</Label><Input id="fc-merk" value={merk} onChange={(e) => setMerk(e.target.value)} placeholder="Bijv. Enphase" /></div>
        <div><Label htmlFor="fc-code">Foutcode</Label><Input id="fc-code" value={foutcode} onChange={(e) => setFoutcode(e.target.value)} placeholder="Bijv. E-12" /></div>
      </div>
      <div>
        <Label htmlFor="fc-ctx">Extra context (optioneel)</Label>
        <Input id="fc-ctx" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Wanneer trad het op, wat heeft klant al geprobeerd" />
      </div>
      <Button onClick={start} disabled={bezig}>
        {bezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Analyseer foutcode
      </Button>

      {analyse ? (
        <div className="space-y-3 border-t pt-4">
          {analyse.betekenis ? <div><p className="text-sm font-medium">Betekenis</p><p className="text-sm text-muted-foreground">{analyse.betekenis}</p></div> : null}
          {analyse.waarschijnlijke_oorzaken?.length ? (
            <div>
              <p className="text-sm font-medium">Waarschijnlijke oorzaken</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {analyse.waarschijnlijke_oorzaken.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          ) : null}
          {analyse.oplossingsstappen?.length ? (
            <div>
              <p className="text-sm font-medium">Oplossingsstappen</p>
              <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                {analyse.oplossingsstappen.map((s) => (
                  <li key={s.stap}><span className="font-medium text-foreground">{s.actie}</span>{s.verwacht_resultaat ? ` — verwacht: ${s.verwacht_resultaat}` : ""}</li>
                ))}
              </ol>
            </div>
          ) : null}
          {analyse.veiligheid ? (
            <div className="flex gap-2 items-start rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <span>{analyse.veiligheid}</span>
            </div>
          ) : null}
          {analyse.wanneer_monteur ? <p className="text-xs text-muted-foreground italic">Monteur nodig: {analyse.wanneer_monteur}</p> : null}
        </div>
      ) : null}
    </Card>
  );
}