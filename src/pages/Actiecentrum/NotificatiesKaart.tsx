import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

function routeFor(et: string | null, id: string | null) {
  if (!et || !id) return null;
  const map: Record<string, string> = {
    helpdesk_tickets: `/helpdesk/tickets/${id}`,
    installaties: `/installaties/${id}`,
    leads: `/leads/${id}`,
    affiliate_leads: `/sales/leads/${id}`,
    offertes: `/offertes/${id}`,
    schouwen: `/schouwen/${id}`,
    opdrachten: `/opdrachten/${id}`,
    financiele_documenten: `/financieel/${id}`,
  };
  return map[et] ?? null;
}

export default function NotificatiesKaart({ items, onChanged }: { items: Array<{ id: string; titel: string; bericht: string; entity_type: string | null; entity_id: string | null; created_at: string }>; onChanged: () => void }) {
  const navigate = useNavigate();

  const open = async (n: { id: string; entity_type: string | null; entity_id: string | null }) => {
    await supabase.from("notificaties").update({ gelezen: true }).eq("id", n.id);
    const r = routeFor(n.entity_type, n.entity_id);
    if (r) navigate(r);
    onChanged();
  };

  const allesGelezen = async () => {
    const ids = items.map(i => i.id);
    if (ids.length === 0) return;
    await supabase.from("notificaties").update({ gelezen: true }).in("id", ids);
    onChanged();
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notificaties ({items.length})</CardTitle>
        {items.length > 0 && <Button variant="ghost" size="sm" onClick={allesGelezen} className="text-xs">Alles gelezen</Button>}
      </CardHeader>
      <CardContent className="pt-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Geen ongelezen notificaties</p>
        ) : items.map((n) => (
          <button key={n.id} onClick={() => open(n)} className="w-full text-left p-2 rounded-lg hover:bg-muted/40 transition-colors">
            <p className="text-sm font-medium">{n.titel}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{n.bericht}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}