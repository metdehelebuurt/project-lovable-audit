import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Check, Clock, ExternalLink, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Taak {
  id: string;
  titel: string;
  ticket_id: string | null;
  deadline: string | null;
  prioriteit: string;
  status: string;
}

const PRIO_STIJL: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  hoog: "bg-warning/10 text-warning-foreground border-warning/30",
  normaal: "bg-muted text-muted-foreground border-transparent",
  laag: "bg-muted/50 text-muted-foreground border-transparent",
};

interface Props {
  items: Taak[];
  onChanged: () => void;
  onNieuw?: () => void;
  compact?: boolean;
}

export default function TakenKaart({ items, onChanged, onNieuw, compact = false }: Props) {
  const navigate = useNavigate();

  const voltooi = async (id: string) => {
    const { error } = await supabase.from("helpdesk_ticket_taken").update({ status: "klaar", voltooid_op: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Taak voltooid");
    onChanged();
  };

  const uitstel = async (t: Taak) => {
    const huidig = t.deadline ? new Date(t.deadline) : new Date();
    huidig.setDate(huidig.getDate() + 1);
    const { error } = await supabase.from("helpdesk_ticket_taken").update({ deadline: huidig.toISOString().slice(0, 10) }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deadline +1 dag");
    onChanged();
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" /> Mijn taken ({items.length})
        </CardTitle>
        {onNieuw && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onNieuw}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nieuw
          </Button>
        )}
      </CardHeader>
      <CardContent className={`pt-2 space-y-2 ${compact ? "max-h-none" : "max-h-[60vh]"} overflow-y-auto`}>
        {items.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">Geen openstaande taken 🎉</p>
            {onNieuw && (
              <Button size="sm" variant="link" className="mt-1 h-auto p-0 text-xs" onClick={onNieuw}>
                + Maak je eerste taak
              </Button>
            )}
          </div>
        ) : items.map((t) => {
          const overdue = t.deadline && new Date(t.deadline) < new Date();
          const prioCls = PRIO_STIJL[t.prioriteit] ?? PRIO_STIJL.normaal;
          return (
            <div key={t.id} className={`p-2.5 rounded-lg border space-y-1.5 hover:border-primary/40 transition-colors ${overdue ? "border-l-2 border-l-destructive" : ""}`}>
              <div className="flex items-start gap-2">
                <p className="text-sm font-medium line-clamp-2 flex-1">{t.titel}</p>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${prioCls}`}>{t.prioriteit}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {t.deadline && (
                  <span className={`flex items-center gap-1 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    <Clock className="h-3 w-3" />
                    {new Date(t.deadline).toLocaleDateString("nl-NL")}
                  </span>
                )}
              </div>
              <div className="flex gap-1 pt-0.5">
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => voltooi(t.id)}>
                  <Check className="h-3 w-3 mr-1" /> Voltooi
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => uitstel(t)}>
                  <Clock className="h-3 w-3 mr-1" /> +1d
                </Button>
                {t.ticket_id && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate(`/helpdesk/tickets/${t.ticket_id}`)}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}