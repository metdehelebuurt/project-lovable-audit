import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Plus } from "lucide-react";
import { PrioriteitBadge } from "./PrioriteitBadge";
import { StatusBadge } from "./StatusBadge";

type Props = { klantId: string; leadId?: string | null };

export function KlantTicketsList({ klantId, leadId }: Props) {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["klant-tickets", klantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("helpdesk_tickets")
        .select("id, ticketnummer, titel, status, prioriteit, created_at")
        .eq("klant_id", klantId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const startNieuw = () => {
    const params = new URLSearchParams({ bron: "klant", klant_id: klantId });
    if (leadId) params.set("lead_id", leadId);
    navigate(`/helpdesk/tickets/nieuw?${params.toString()}`);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-primary" /> Helpdesk-tickets
        </CardTitle>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={startNieuw}>
          <Plus className="h-3.5 w-3.5" /> Nieuw ticket
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
        {!isLoading && tickets.length === 0 && (
          <p className="text-sm text-muted-foreground">Nog geen tickets voor deze klant.</p>
        )}
        {tickets.length > 0 && (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <Link to={`/helpdesk/tickets/${t.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className="font-medium text-sm truncate">{t.ticketnummer} — {t.titel}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("nl-NL")}</p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <PrioriteitBadge prio={t.prioriteit} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
