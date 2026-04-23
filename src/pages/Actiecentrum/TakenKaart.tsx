import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Check, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Taak {
  id: string;
  titel: string;
  ticket_id: string | null;
  deadline: string | null;
  prioriteit: string;
  status: string;
}

export default function TakenKaart({ items, onChanged }: { items: Taak[]; onChanged: () => void }) {
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4 text-primary" /> Mijn taken ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Geen openstaande taken</p>
        ) : items.map((t) => {
          const overdue = t.deadline && new Date(t.deadline) < new Date();
          return (
            <div key={t.id} className="p-2 rounded-lg border space-y-1">
              <p className="text-sm font-medium line-clamp-2">{t.titel}</p>
              <div className="flex items-center gap-2 text-xs">
                {t.deadline && <span className={overdue ? "text-destructive" : "text-muted-foreground"}>📅 {new Date(t.deadline).toLocaleDateString("nl-NL")}</span>}
                <span className="text-muted-foreground">· {t.prioriteit}</span>
              </div>
              <div className="flex gap-1 pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => voltooi(t.id)}>
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