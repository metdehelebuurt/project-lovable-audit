import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText, Users as UsersIcon, Euro, Target } from "lucide-react";

interface GebruikerStatsProps {
  userId: string;
  partnerId: string;
}

const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const GebruikerStats = ({ userId, partnerId }: GebruikerStatsProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["gebruiker-stats", userId, partnerId],
    queryFn: async () => {
      const [leadsRes, schouwenRes, offertesRes, omzetRes] = await Promise.all([
        supabase.from("leads").select("id, lead_status", { count: "exact" }).eq("owner_user_id", userId).eq("partner_id", partnerId),
        supabase.from("schouwen").select("id", { count: "exact", head: true }).eq("adviseur_id", userId).eq("partner_id", partnerId),
        supabase.from("offertes").select("id, status, totaal", { count: "exact" }).eq("adviseur_id", userId).eq("partner_id", partnerId),
        supabase.from("offertes").select("totaal").eq("adviseur_id", userId).eq("partner_id", partnerId).eq("status", "geaccepteerd"),
      ]);

      const leads = leadsRes.data ?? [];
      const offertes = offertesRes.data ?? [];
      const geaccepteerd = offertes.filter((o: any) => o.status === "geaccepteerd").length;
      const omzet = (omzetRes.data ?? []).reduce((sum: number, o: any) => sum + (Number(o.totaal) || 0), 0);
      const conversie = offertes.length > 0 ? Math.round((geaccepteerd / offertes.length) * 100) : 0;

      return {
        leadsTotaal: leadsRes.count ?? 0,
        leadsActief: leads.filter((l: any) => !["gewonnen", "verloren", "afgesloten"].includes(l.lead_status)).length,
        schouwenTotaal: schouwenRes.count ?? 0,
        offertesTotaal: offertesRes.count ?? 0,
        offertesGeaccepteerd: geaccepteerd,
        omzet,
        conversie,
      };
    },
  });

  const stats = [
    { icon: UsersIcon, label: "Leads (actief / totaal)", value: data ? `${data.leadsActief} / ${data.leadsTotaal}` : "—", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30" },
    { icon: Target, label: "Schouwen", value: data?.schouwenTotaal ?? "—", color: "bg-purple-50 text-purple-600 dark:bg-purple-950/30" },
    { icon: FileText, label: "Offertes", value: data?.offertesTotaal ?? "—", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30" },
    { icon: TrendingUp, label: "Conversie", value: data ? `${data.conversie}%` : "—", color: "bg-green-50 text-green-600 dark:bg-green-950/30" },
    { icon: Euro, label: "Gerealiseerde omzet", value: data ? formatEuro(data.omzet) : "—", color: "bg-primary/10 text-primary" },
  ];

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Statistieken</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border p-3 space-y-2">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${s.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold text-foreground">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GebruikerStats;