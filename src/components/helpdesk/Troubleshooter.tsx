import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

interface Suggestie { actie: string; toelichting: string }
interface Analyse {
  herkend_uit_kb?: boolean;
  match_artikel_id?: string | null;
  diagnose?: string;
  vervolgvragen?: string[];
  suggesties?: Suggestie[];
  monteur_aanbevolen?: boolean;
  monteur_reden?: string;
}
interface Gerelateerd { id: string; ticketnummer: string; titel: string }

export function Troubleshooter({ ticket, userId }: { ticket: HelpdeskTicket; userId: string }) {
  const [probleem, setProbleem] = useState(ticket.omschrijving ?? "");
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [gerelateerd, setGerelateerd] = useState<Gerelateerd[]>([]);
  const [bezig, setBezig] = useState(false);

  const start = async () => {
    if (!probleem.trim()) { toast.error("Beschrijf het probleem"); return; }
    setBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("helpdesk-ai-troubleshooter", {
        body: {
          ticket_id: ticket.id,
          partner_id: ticket.partner_id,
          user_id: userId,
          probleem,
          product_categorie: ticket.product_categorie,
          product_merk: ticket.product_merk,
          product_type: ticket.product_type,
          foutcode: ticket.foutcode,
        },
      });
      if (error) throw error;
      const out = data as { analyse: Analyse; gerelateerde_tickets: Gerelateerd[] };
      setAnalyse(out.analyse);
      setGerelateerd(out.gerelateerde_tickets ?? []);
    } catch (e) {
      toast.error(`Troubleshooter mislukt: ${(e as Error).message}`);
    } finally {
      setBezig(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" />AI Troubleshooter</h3>
        <p className="text-sm text-muted-foreground">Doorzoekt eerst kennisbank en eerdere tickets van dit bedrijf, daarna AI-analyse.</p>
      </div>
      <Textarea rows={4} value={probleem} onChange={(e) => setProbleem(e.target.value)} placeholder="Beschrijf het probleem zoals de klant het meldt" />
      <Button onClick={start} disabled={bezig}>
        {bezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Start troubleshooter
      </Button>

      {analyse ? (
        <div className="space-y-4 border-t pt-4">
          {analyse.herkend_uit_kb ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm flex gap-2 items-start">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Dit probleem is eerder voorgekomen — zie kennisbank en gerelateerde tickets hieronder.</span>
            </div>
          ) : null}
          {analyse.diagnose ? <div><p className="text-sm font-medium">Diagnose</p><p className="text-sm text-muted-foreground">{analyse.diagnose}</p></div> : null}
          {analyse.suggesties?.length ? (
            <div>
              <p className="text-sm font-medium">Suggesties</p>
              <ul className="text-sm space-y-2 mt-1">
                {analyse.suggesties.map((s, i) => (
                  <li key={i} className="border rounded-md p-2"><span className="font-medium">{s.actie}</span><br /><span className="text-muted-foreground">{s.toelichting}</span></li>
                ))}
              </ul>
            </div>
          ) : null}
          {analyse.vervolgvragen?.length ? (
            <div>
              <p className="text-sm font-medium">Vervolgvragen aan klant</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {analyse.vervolgvragen.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          ) : null}
          {analyse.monteur_aanbevolen ? (
            <p className="text-sm rounded-md border border-warning/30 bg-warning/5 p-3">Monteur aanbevolen: {analyse.monteur_reden}</p>
          ) : null}
          {gerelateerd.length ? (
            <div>
              <p className="text-sm font-medium">Gerelateerde tickets</p>
              <ul className="text-sm space-y-1">
                {gerelateerd.map((t) => (
                  <li key={t.id}>
                    <Link to={`/helpdesk/tickets/${t.id}`} className="text-primary hover:underline">{t.ticketnummer}</Link> — {t.titel}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}