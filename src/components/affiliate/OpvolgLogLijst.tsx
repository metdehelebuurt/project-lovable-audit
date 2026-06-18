import { Badge } from "@/components/ui/badge";
import { History, Sparkles, Clock, Mail, AlertTriangle, CheckCircle2, Cog } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useOpvolgLog, type OpvolgLogEntry } from "@/hooks/affiliate/useOpvolgLog";

const ICOON: Record<string, JSX.Element> = {
  ai: <Sparkles className="h-3.5 w-3.5 text-primary" />,
  cron: <Cog className="h-3.5 w-3.5 text-muted-foreground" />,
  systeem: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  affiliate: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
};

const ACTIE_ICOON: Record<string, JSX.Element> = {
  herinnering_verstuurd: <Mail className="h-3.5 w-3.5" />,
  escalatie_verstuurd: <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />,
  ai_score: <Sparkles className="h-3.5 w-3.5 text-primary" />,
  ai_plan: <Sparkles className="h-3.5 w-3.5 text-primary" />,
  taak_aangemaakt: <CheckCircle2 className="h-3.5 w-3.5" />,
  taak_voltooid: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  taak_verzet: <Clock className="h-3.5 w-3.5" />,
};

function renderDetails(entry: OpvolgLogEntry) {
  const d = (entry.details ?? {}) as Record<string, unknown>;
  const stukjes: string[] = [];
  if (typeof d.score === "number") stukjes.push(`score ${d.score}/100`);
  if (typeof d.aantal_taken === "number") stukjes.push(`${d.aantal_taken} taak/taken`);
  if (typeof d.template === "string") stukjes.push(d.template as string);
  if (typeof d.regel_lead_type === "string") stukjes.push(`regel ${d.regel_lead_type}`);
  return stukjes.join(" · ");
}

export function OpvolgLogLijst({ leadId }: { leadId: string }) {
  const { data: log = [], isLoading } = useOpvolgLog(leadId);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2"><History className="h-4 w-4" /> Opvolg-log</Label>
      {isLoading && <p className="text-xs text-muted-foreground">Laden…</p>}
      {!isLoading && log.length === 0 && (
        <p className="text-xs text-muted-foreground">Nog geen opvolg-acties geregistreerd.</p>
      )}
      <div className="space-y-1.5">
        {log.map((e) => {
          const extra = renderDetails(e);
          return (
            <div key={e.id} className="text-xs border rounded-md p-2 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {ACTIE_ICOON[e.actie] ?? ICOON[e.bron]}
                  <span className="font-medium truncate">{e.titel}</span>
                  <Badge variant="outline" className="text-[10px] gap-1">{ICOON[e.bron]}{e.bron}</Badge>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {extra && <p className="text-muted-foreground mt-0.5">{extra}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}