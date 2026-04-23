import { useQuery } from "@tanstack/react-query";
import { Calendar, ListTodo, Activity } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

function MiniCard({ icon: Icon, label, value, hint }: {
  icon: React.ElementType; label: string; value: string | number; hint?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/40 bg-card/60 backdrop-blur-sm p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </Card>
  );
}

export function WidgetsRow() {
  const { profile } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data } = useQuery({
    queryKey: ["apps-view-widgets", profile?.id, today],
    queryFn: async () => {
      const [afspraken, notificaties] = await Promise.all([
        supabase.from("afspraken").select("id", { count: "exact", head: true }).eq("datum", today),
        supabase.from("notificaties").select("id", { count: "exact", head: true }).eq("gelezen", false),
      ]);
      return {
        vandaag: afspraken.count ?? 0,
        openstaand: notificaties.count ?? 0,
      };
    },
    enabled: !!profile,
    staleTime: 60_000,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <MiniCard icon={Calendar} label="Vandaag" value={data?.vandaag ?? 0} hint="Afspraken in agenda" />
      <MiniCard icon={ListTodo} label="Openstaand" value={data?.openstaand ?? 0} hint="Ongelezen meldingen" />
      <MiniCard icon={Activity} label="Activiteit" value="Live" hint="Realtime updates aan" />
    </div>
  );
}
