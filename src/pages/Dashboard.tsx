import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ClipboardList, FileText, Wrench, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ElementType; color: string }) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </CardContent>
  </Card>
);

interface ActivityItem {
  id: string;
  type: "lead" | "offerte" | "schouw" | "installatie";
  label: string;
  status: string;
  date: string;
}

const typeIcons: Record<string, React.ElementType> = {
  lead: TrendingUp, offerte: FileText, schouw: ClipboardList, installatie: Wrench,
};
const typeColors: Record<string, string> = {
  lead: "text-primary", offerte: "text-warning", schouw: "text-success", installatie: "text-accent-foreground",
};

const rolDashboards: Record<string, { title: string; description: string }> = {
  superadmin: { title: "Platform Overzicht", description: "Welkom bij het mijnhuis.nu beheerpaneel." },
  partner_admin: { title: "Organisatie Overzicht", description: "Beheer uw organisatie, medewerkers en leads." },
  partner_staff: { title: "Overzicht", description: "Bekijk uw taken en activiteiten." },
  adviseur: { title: "Mijn Overzicht", description: "Uw leads, schouwen en offertes op een rij." },
  installateur: { title: "Mijn Opdrachten", description: "Uw geplande en lopende installaties." },
  consument: { title: "Mijn Woning", description: "Volg de status van uw woningverbeteringen." },
};

const Dashboard = () => {
  const { profile } = useAuth();
  const rol = profile?.rol ?? "consument";
  const dash = rolDashboards[rol] ?? rolDashboards.consument;

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", rol, profile?.id],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      if (["superadmin", "partner_admin", "partner_staff"].includes(rol)) {
        const [partners, users, leads, schouwen, offertes, installaties] = await Promise.all([
          rol === "superadmin" ? supabase.from("partners").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("schouwen").select("id", { count: "exact", head: true }),
          supabase.from("offertes").select("id", { count: "exact", head: true }),
          supabase.from("installaties").select("id", { count: "exact", head: true }),
        ]);
        counts.partners = partners.count ?? 0;
        counts.users = users.count ?? 0;
        counts.leads = leads.count ?? 0;
        counts.schouwen = schouwen.count ?? 0;
        counts.offertes = offertes.count ?? 0;
        counts.installaties = installaties.count ?? 0;
      } else if (rol === "adviseur") {
        const [leads, schouwen, offertes] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("schouwen").select("id", { count: "exact", head: true }),
          supabase.from("offertes").select("id", { count: "exact", head: true }),
        ]);
        counts.leads = leads.count ?? 0;
        counts.schouwen = schouwen.count ?? 0;
        counts.offertes = offertes.count ?? 0;
      } else if (rol === "installateur") {
        const [installaties, gepland] = await Promise.all([
          supabase.from("installaties").select("id", { count: "exact", head: true }),
          supabase.from("installaties").select("id", { count: "exact", head: true }).eq("status", "gepland"),
        ]);
        counts.installaties = installaties.count ?? 0;
        counts.gepland = gepland.count ?? 0;
      } else {
        const [offertes, schouwen] = await Promise.all([
          supabase.from("offertes").select("id", { count: "exact", head: true }),
          supabase.from("schouwen").select("id", { count: "exact", head: true }),
        ]);
        counts.offertes = offertes.count ?? 0;
        counts.schouwen = schouwen.count ?? 0;
      }
      return counts;
    },
    enabled: !!profile,
  });

  const { data: activity } = useQuery({
    queryKey: ["dashboard-activity", rol, profile?.id],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      const [leads, offertes, schouwen, installaties] = await Promise.all([
        supabase.from("leads").select("id, voornaam, achternaam, lead_status, updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("offertes").select("id, offertenummer, status, updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("schouwen").select("id, schouw_nummer, consument_naam, status, updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("installaties").select("id, consument_naam, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      ]);

      (leads.data ?? []).forEach((l) => items.push({ id: l.id, type: "lead", label: `${l.voornaam} ${l.achternaam}`, status: l.lead_status, date: l.updated_at }));
      (offertes.data ?? []).forEach((o) => items.push({ id: o.id, type: "offerte", label: o.offertenummer, status: o.status, date: o.updated_at }));
      (schouwen.data ?? []).forEach((s) => items.push({ id: s.id, type: "schouw", label: s.consument_naam ?? s.schouw_nummer, status: s.status, date: s.updated_at }));
      (installaties.data ?? []).forEach((i) => items.push({ id: i.id, type: "installatie", label: i.consument_naam ?? "Installatie", status: i.status, date: i.updated_at }));

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    },
    enabled: !!profile,
  });

  const s = stats ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{dash.title}</h1>
        <p className="text-muted-foreground mt-1">{dash.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rol === "superadmin" && (
          <>
            <StatCard title="Partners" value={s.partners ?? 0} icon={Building2} color="bg-primary/10 text-primary" />
            <StatCard title="Gebruikers" value={s.users ?? 0} icon={Users} color="bg-success-light text-success" />
            <StatCard title="Leads" value={s.leads ?? 0} icon={TrendingUp} color="bg-warning-light text-warning" />
            <StatCard title="Offertes" value={s.offertes ?? 0} icon={FileText} color="bg-accent text-accent-foreground" />
          </>
        )}
        {(rol === "partner_admin" || rol === "partner_staff") && (
          <>
            <StatCard title="Leads" value={s.leads ?? 0} icon={Users} color="bg-primary/10 text-primary" />
            <StatCard title="Schouwen" value={s.schouwen ?? 0} icon={ClipboardList} color="bg-success-light text-success" />
            <StatCard title="Offertes" value={s.offertes ?? 0} icon={FileText} color="bg-warning-light text-warning" />
            <StatCard title="Installaties" value={s.installaties ?? 0} icon={Wrench} color="bg-accent text-accent-foreground" />
          </>
        )}
        {rol === "adviseur" && (
          <>
            <StatCard title="Mijn Leads" value={s.leads ?? 0} icon={Users} color="bg-primary/10 text-primary" />
            <StatCard title="Schouwen" value={s.schouwen ?? 0} icon={ClipboardList} color="bg-success-light text-success" />
            <StatCard title="Offertes" value={s.offertes ?? 0} icon={FileText} color="bg-warning-light text-warning" />
          </>
        )}
        {rol === "installateur" && (
          <>
            <StatCard title="Opdrachten" value={s.installaties ?? 0} icon={Wrench} color="bg-primary/10 text-primary" />
            <StatCard title="Gepland" value={s.gepland ?? 0} icon={ClipboardList} color="bg-success-light text-success" />
          </>
        )}
        {rol === "consument" && (
          <>
            <StatCard title="Offertes" value={s.offertes ?? 0} icon={FileText} color="bg-primary/10 text-primary" />
            <StatCard title="Schouwen" value={s.schouwen ?? 0} icon={ClipboardList} color="bg-success-light text-success" />
          </>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recente Activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          {!activity || activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nog geen activiteiten om weer te geven.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => {
                const Icon = typeIcons[item.type];
                return (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center ${typeColors[item.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        <span className="capitalize">{item.type}</span>: {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">Status: {item.status}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
