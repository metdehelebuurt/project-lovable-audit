import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, ClipboardList, FileText, Wrench, TrendingUp,
  Calendar, Package, BarChart3, UserCheck2,
  ClipboardCheck, Bell, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import MonteurDashboard from "@/components/dashboard/MonteurDashboard";
import { AppsView } from "@/components/dashboard/apps-view";
import { DashboardViewSwitcher } from "@/components/dashboard/DashboardViewSwitcher";
import { useDashboardView } from "@/components/dashboard/apps-view/useDashboardView";

/* ─── Mini Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, trend }: {
  label: string; value: number | string; icon: React.ElementType; trend?: number;
}) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">{value}</span>
          {trend !== undefined && (
            <span className={`text-[10px] font-medium flex items-center gap-0.5 ${trend >= 0 ? "text-primary" : "text-destructive"}`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ─── Module Tile ─── */
const ModuleTile = ({ title, subtitle, icon: Icon, to }: {
  title: string; subtitle: string; icon: React.ElementType; to: string;
}) => {
  const navigate = useNavigate();
  return (
    <Card
      className="rounded-2xl border-0 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
      onClick={() => navigate(to)}
    >
      <CardContent className="p-5 flex flex-col items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Role config ─── */
const rolDashboards: Record<string, { title: string; description: string }> = {
  superadmin: { title: "Platform Overzicht", description: "Welkom bij het mijnhuis.nu beheerpaneel." },
  partner_admin: { title: "Organisatie Overzicht", description: "Beheer uw organisatie, medewerkers en leads." },
  partner_staff: { title: "Overzicht", description: "Bekijk uw taken en activiteiten." },
  adviseur: { title: "Mijn Overzicht", description: "Uw leads, schouwen en offertes op een rij." },
  installateur: { title: "Mijn werk", description: "Vandaag, komende dagen en open rapporten." },
  consument: { title: "Mijn Woning", description: "Volg de status van uw woningverbeteringen." },
};

const typeIcons: Record<string, React.ElementType> = {
  lead: TrendingUp, offerte: FileText, schouw: ClipboardList, installatie: Wrench,
};

interface ActivityItem {
  id: string; type: "lead" | "offerte" | "schouw" | "installatie";
  label: string; status: string; date: string;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const rol = profile?.rol ?? "consument";
  const dash = rolDashboards[rol] ?? rolDashboards.consument;
  const { view, setView } = useDashboardView();

  /* ─── Stats ─── */
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", rol, profile?.id],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      const today = format(new Date(), "yyyy-MM-dd");

      if (["superadmin", "partner_admin", "partner_staff"].includes(rol)) {
        const [partners, users, leads, schouwen, offertes, installaties, openOffertes, afspraken] = await Promise.all([
          rol === "superadmin" ? supabase.from("partners").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("schouwen").select("id", { count: "exact", head: true }),
          supabase.from("offertes").select("id", { count: "exact", head: true }),
          supabase.from("installaties").select("id", { count: "exact", head: true }),
          supabase.from("offertes").select("id", { count: "exact", head: true }).eq("status", "verzonden"),
          supabase.from("afspraken").select("id", { count: "exact", head: true }).eq("datum", today),
        ]);
        counts.partners = partners.count ?? 0;
        counts.users = users.count ?? 0;
        counts.leads = leads.count ?? 0;
        counts.schouwen = schouwen.count ?? 0;
        counts.offertes = offertes.count ?? 0;
        counts.installaties = installaties.count ?? 0;
        counts.openOffertes = openOffertes.count ?? 0;
        counts.afspraken = afspraken.count ?? 0;

        const { count: accepted } = await supabase.from("offertes").select("id", { count: "exact", head: true }).eq("status", "geaccepteerd");
        const total = counts.offertes || 1;
        counts.conversie = Math.round(((accepted ?? 0) / total) * 100);
      } else if (rol === "adviseur") {
        const [leads, schouwen, offertes, openOffertes, afspraken] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("schouwen").select("id", { count: "exact", head: true }),
          supabase.from("offertes").select("id", { count: "exact", head: true }),
          supabase.from("offertes").select("id", { count: "exact", head: true }).eq("status", "verzonden"),
          supabase.from("afspraken").select("id", { count: "exact", head: true }).eq("datum", today),
        ]);
        counts.leads = leads.count ?? 0;
        counts.schouwen = schouwen.count ?? 0;
        counts.offertes = offertes.count ?? 0;
        counts.openOffertes = openOffertes.count ?? 0;
        counts.afspraken = afspraken.count ?? 0;
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

  /* ─── Chart data: leads & offertes per week (last 8 weeks) ─── */
  const { data: chartData } = useQuery({
    queryKey: ["dashboard-chart", rol, profile?.id],
    queryFn: async () => {
      const weeks: { name: string; leads: number; offertes: number }[] = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = subDays(now, i * 7 + 6);
        const weekEnd = subDays(now, i * 7);
        const label = format(weekEnd, "d MMM", { locale: nl });
        const startStr = format(weekStart, "yyyy-MM-dd");
        const endStr = format(weekEnd, "yyyy-MM-dd'T'23:59:59");

        const [leadsRes, offertesRes] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true })
            .gte("created_at", startStr).lte("created_at", endStr),
          supabase.from("offertes").select("id", { count: "exact", head: true })
            .gte("created_at", startStr).lte("created_at", endStr),
        ]);
        weeks.push({ name: label, leads: leadsRes.count ?? 0, offertes: offertesRes.count ?? 0 });
      }
      return weeks;
    },
    enabled: !!profile && ["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol),
  });

  /* ─── Chart data: offerte status verdeling ─── */
  const { data: statusData } = useQuery({
    queryKey: ["dashboard-status-chart", rol, profile?.id],
    queryFn: async () => {
      const statuses = ["concept", "verzonden", "geaccepteerd", "afgewezen", "verlopen"] as const;
      const results = await Promise.all(
        statuses.map(s => supabase.from("offertes").select("id", { count: "exact", head: true }).eq("status", s))
      );
      return statuses.map((s, i) => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        aantal: results[i].count ?? 0,
      }));
    },
    enabled: !!profile && ["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol),
  });

  /* ─── Activity ─── */
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
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    },
    enabled: !!profile,
  });

  /* ─── Notifications ─── */
  const { data: notifications } = useQuery({
    queryKey: ["dashboard-notificaties", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notificaties")
        .select("id, titel, bericht, type, created_at, gelezen")
        .eq("gelezen", false)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!profile,
  });

  const s = stats ?? {};
  const showCharts = ["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol);

  /* ─── Stat cards per role ─── */
  const getStatCards = () => {
    const cards: { label: string; value: number | string; icon: React.ElementType }[] = [];
    if (rol === "superadmin") {
      cards.push({ label: "Partners", value: s.partners ?? 0, icon: Users });
    }
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol)) {
      cards.push(
        { label: "Leads", value: s.leads ?? 0, icon: TrendingUp },
        { label: "Offertes", value: s.offertes ?? 0, icon: FileText },
        { label: "Openstaand", value: s.openOffertes ?? 0, icon: FileText },
      );
    }
    if (["superadmin", "partner_admin", "partner_staff"].includes(rol)) {
      cards.push(
        { label: "Conversie", value: `${s.conversie ?? 0}%`, icon: BarChart3 },
        { label: "Schouwen", value: s.schouwen ?? 0, icon: ClipboardList },
      );
    }
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol)) {
      cards.push({ label: "Vandaag", value: s.afspraken ?? 0, icon: Calendar });
    }
    if (rol === "installateur") {
      cards.push(
        { label: "Verkooporders", value: s.installaties ?? 0, icon: Wrench },
        { label: "Gepland", value: s.gepland ?? 0, icon: Calendar },
      );
    }
    if (rol === "consument") {
      cards.push(
        { label: "Offertes", value: s.offertes ?? 0, icon: FileText },
        { label: "Schouwen", value: s.schouwen ?? 0, icon: ClipboardList },
      );
    }
    return cards;
  };

  /* ─── Module tiles per role ─── */
  const getModuleTiles = () => {
    const tiles = [];
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol))
      tiles.push({ title: "Leads", subtitle: "Nieuwe aanvragen beheren", icon: Users, to: "/leads" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument", "affiliate"].includes(rol))
      tiles.push({ title: "Offertes", subtitle: "Offertes maken en versturen", icon: FileText, to: "/offertes" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"].includes(rol))
      tiles.push({ title: "Schouwen", subtitle: "Schouwrapportages beheren", icon: ClipboardList, to: "/schouwen" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"].includes(rol))
      tiles.push({ title: "Verkooporders", subtitle: "Lopende verkooporders inzien", icon: ClipboardCheck, to: "/opdrachten" });
    if (["partner_admin", "partner_staff", "adviseur", "installateur", "consument"].includes(rol))
      tiles.push({ title: "Planning", subtitle: "Afspraken en agenda", icon: Calendar, to: "/planning" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"].includes(rol))
      tiles.push({ title: "Producten", subtitle: "Productcatalogus", icon: Package, to: "/producten" });
    if (["partner_admin", "partner_staff"].includes(rol))
      tiles.push({ title: "Analytics", subtitle: "Rapportages en inzichten", icon: BarChart3, to: "/analytics" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol))
      tiles.push({ title: "Klanten", subtitle: "Klantendatabase", icon: UserCheck2, to: "/klanten" });
    return tiles;
  };

  const customTooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{dash.title}</h1>
          <p className="text-muted-foreground mt-1">{dash.description}</p>
        </div>
        {rol !== "consument" && (
          <DashboardViewSwitcher view={view} onChange={setView} />
        )}
      </div>

      {rol === "installateur" ? (
        <MonteurDashboard />
      ) : (
      <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {getStatCards().map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads & Offertes (8 weken)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(242, 67%, 62%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(242, 67%, 62%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradOffertes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(242, 67%, 75%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(242, 67%, 75%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(242, 67%, 62%)" fill="url(#gradLeads)" strokeWidth={2} />
                    <Area type="monotone" dataKey="offertes" name="Offertes" stroke="hsl(242, 67%, 75%)" fill="url(#gradOffertes)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Offerte Statusverdeling</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="aantal" name="Aantal" fill="hsl(242, 67%, 62%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {getModuleTiles().map((tile) => (
          <ModuleTile key={tile.title} {...tile} />
        ))}
      </div>

      {/* Bottom row: Activity + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recente Activiteit</CardTitle>
          </CardHeader>
          <CardContent>
            {!activity || activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nog geen activiteiten.</p>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => {
                  const Icon = typeIcons[item.type];
                  return (
                    <div key={`${item.type}-${item.id}`} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          <span className="capitalize">{item.type}</span>: {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{item.status}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: nl })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Notificaties
              </CardTitle>
              {(notifications?.length ?? 0) > 0 && (
                <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium">
                  {notifications?.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!notifications || notifications.length === 0 ? (
              <p className="text-muted-foreground text-sm">Geen nieuwe notificaties.</p>
            ) : (
              <div className="space-y-1">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 py-1.5 border-b border-border last:border-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bell className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{n.titel}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{n.bericht}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;
