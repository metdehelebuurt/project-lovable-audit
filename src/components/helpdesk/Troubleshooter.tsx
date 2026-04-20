import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, BookOpen, History, ListChecks, MessageCircleQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { useTicketAiSessies, type AiSessie } from "@/hooks/helpdesk/useTicketAiSessies";

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
interface AntwoordPaar { vraag: string; antwoord: string }

export function Troubleshooter({ ticket, userId }: { ticket: HelpdeskTicket; userId: string }) {
  const queryClient = useQueryClient();
  const { data: sessies } = useTicketAiSessies(ticket.id, "troubleshooter");
  const [probleem, setProbleem] = useState(ticket.omschrijving ?? "");
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [gerelateerd, setGerelateerd] = useState<Gerelateerd[]>([]);
  const [bezig, setBezig] = useState(false);
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({});
  const [historie, setHistorie] = useState<AntwoordPaar[]>([]);
  const [toonHistorie, setToonHistorie] = useState(false);

  // Laatst opgeslagen sessie automatisch tonen
  useEffect(() => {
    if (analyse || !sessies?.length) return;
    const laatste = sessies[0];
    const out = laatste.output as Analyse;
    if (out) {
      setAnalyse(out);
      setGerelateerd((laatste.gerelateerde_tickets ?? []) as Gerelateerd[]);
      const input = laatste.input as { probleem?: string; eerdere_antwoorden?: AntwoordPaar[] };
      if (input?.probleem) setProbleem(input.probleem);
      if (input?.eerdere_antwoorden) setHistorie(input.eerdere_antwoorden);
    }
  }, [sessies, analyse]);

  const runAi = async (eerdere_antwoorden: AntwoordPaar[]) => {
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
          eerdere_antwoorden,
        },
      });
      if (error) throw error;
      const out = data as { analyse: Analyse; gerelateerde_tickets: Gerelateerd[] };
      setAnalyse(out.analyse);
      setGerelateerd(out.gerelateerde_tickets ?? []);
      setAntwoorden({});
      queryClient.invalidateQueries({ queryKey: ["helpdesk_ticket_ai_sessies", ticket.id] });
      toast.success("Analyse opgeslagen bij ticket");
    } catch (e) {
      toast.error(`Troubleshooter mislukt: ${(e as Error).message}`);
    } finally {
      setBezig(false);
    }
  };

  const start = async () => {
    if (!probleem.trim()) { toast.error("Beschrijf het probleem"); return; }
    setHistorie([]);
    await runAi([]);
  };

  const verstuurAntwoorden = async () => {
    const nieuw = (analyse?.vervolgvragen ?? [])
      .map((vraag) => ({ vraag, antwoord: (antwoorden[vraag] ?? "").trim() }))
      .filter((p) => p.antwoord.length > 0);
    if (!nieuw.length) { toast.error("Beantwoord minstens één vraag"); return; }
    const samengevoegd = [...historie, ...nieuw];
    setHistorie(samengevoegd);
    await runAi(samengevoegd);
  };

  const heeftVragen = useMemo(() => (analyse?.vervolgvragen?.length ?? 0) > 0, [analyse]);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" />AI Troubleshooter</h3>
        <p className="text-sm text-muted-foreground">Doorzoekt eerst kennisbank en eerdere tickets van dit bedrijf, daarna AI-analyse.</p>
      </div>
      <Textarea rows={4} value={probleem} onChange={(e) => setProbleem(e.target.value)} placeholder="Beschrijf het probleem zoals de klant het meldt" />
      <div className="flex flex-wrap gap-2">
        <Button onClick={start} disabled={bezig}>
          {bezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {analyse ? "Opnieuw analyseren" : "Start troubleshooter"}
        </Button>
        {sessies && sessies.length > 1 ? (
          <Button variant="outline" type="button" onClick={() => setToonHistorie((v) => !v)}>
            <History className="h-4 w-4 mr-2" />
            {toonHistorie ? "Verberg" : "Toon"} eerdere analyses ({sessies.length})
          </Button>
        ) : null}
      </div>

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
              <p className="text-sm font-medium flex items-center gap-2"><ListChecks className="h-4 w-4" />Vervolgstappen om probleem op te lossen</p>
              <ol className="text-sm space-y-2 mt-2 list-decimal pl-5">
                {analyse.suggesties.map((s, i) => (
                  <li key={i} className="pl-1">
                    <span className="font-medium">{s.actie}</span>
                    {s.toelichting ? <div className="text-muted-foreground mt-0.5">{s.toelichting}</div> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {heeftVragen ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4" />Vervolgvragen — beantwoord om de analyse aan te scherpen</p>
              <div className="space-y-2">
                {analyse.vervolgvragen!.map((v, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-sm">{v}</p>
                    <Textarea
                      rows={2}
                      value={antwoorden[v] ?? ""}
                      onChange={(e) => setAntwoorden((a) => ({ ...a, [v]: e.target.value }))}
                      placeholder="Antwoord van klant of monteur"
                    />
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={verstuurAntwoorden} disabled={bezig}>
                {bezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Verstuur antwoorden & analyseer opnieuw
              </Button>
            </div>
          ) : null}
          {historie.length ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Eerder beantwoorde vragen ({historie.length})</summary>
              <div className="mt-2 space-y-2 pl-2 border-l-2 border-muted">
                {historie.map((p, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium">Q: {p.vraag}</p>
                    <p className="text-xs text-muted-foreground">A: {p.antwoord}</p>
                  </div>
                ))}
              </div>
            </details>
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

      {toonHistorie && sessies && sessies.length > 1 ? (
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Eerdere analyses</p>
          {sessies.slice(1).map((s) => (
            <SessieKaart key={s.id} sessie={s} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function SessieKaart({ sessie }: { sessie: AiSessie }) {
  const out = sessie.output as Analyse;
  return (
    <div className="rounded-md border p-3 text-sm space-y-1">
      <p className="text-xs text-muted-foreground">{new Date(sessie.created_at).toLocaleString("nl-NL")}</p>
      {out?.diagnose ? <p>{out.diagnose}</p> : null}
      {out?.suggesties?.length ? (
        <p className="text-xs text-muted-foreground">{out.suggesties.length} vervolgstappen voorgesteld</p>
      ) : null}
    </div>
  );
}