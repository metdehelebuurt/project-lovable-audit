import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, Users, ClipboardList, FileText, Wrench, TrendingUp,
  Calendar, Package, BarChart3, PenTool, MessageSquare, UserCheck2,
  ClipboardCheck, Bell, ArrowRight
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

/* ─── Mini Stat ─── */
const MiniStat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex flex-col items-center px-4 py-2">
    <span className="text-xl font-bold text-foreground">{value}</span>
    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
  </div>
);

/* ─── Module Tile ─── */
const ModuleTile = ({ title, subtitle, icon: Icon, color, to }: {
  title: string; subtitle: string; icon: React.ElementType; color: string; to: string;
}) => {
  const navigate = useNavigate();
  return (
    <Card
      className="rounded-2xl border-0 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
      onClick={() => navigate(to)}
    >
      <CardContent className="p-5 flex flex-col items-start gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
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
  installateur: { title: "Mijn Opdrachten", description: "Uw geplande en lopende installaties." },
  consument: { title: "Mijn Woning", description: "Volg de status van uw woningverbeteringen." },
};

const typeIcons: Record<string, React.ElementType> = {
  lead: TrendingUp, offerte: FileText, schouw: ClipboardList, installatie: Wrench,
};
const typeColors: Record<string, string> = {
  lead: "text-primary", offerte: "text-warning", schouw: "text-success", installatie: "text-accent-foreground",
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

        // Conversieratio
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

  /* ─── Module tiles per role ─── */
  const getModuleTiles = () => {
    const tiles = [];
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol))
      tiles.push({ title: "Leads", subtitle: "Nieuwe aanvragen beheren", icon: Users, color: "bg-primary/10 text-primary", to: "/leads" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument", "affiliate"].includes(rol))
      tiles.push({ title: "Offertes", subtitle: "Offertes maken en versturen", icon: FileText, color: "bg-warning-light text-warning", to: "/offertes" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"].includes(rol))
      tiles.push({ title: "Schouwen", subtitle: "Schouwrapportages beheren", icon: ClipboardList, color: "bg-success-light text-success", to: "/schouwen" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"].includes(rol))
      tiles.push({ title: "Opdrachten", subtitle: "Lopende opdrachten inzien", icon: ClipboardCheck, color: "bg-accent text-accent-foreground", to: "/opdrachten" });
    if (["partner_admin", "partner_staff", "adviseur", "installateur", "consument"].includes(rol))
      tiles.push({ title: "Planning", subtitle: "Afspraken en agenda", icon: Calendar, color: "bg-primary/10 text-primary", to: "/planning" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"].includes(rol))
      tiles.push({ title: "Producten", subtitle: "Productcatalogus", icon: Package, color: "bg-success-light text-success", to: "/producten" });
    if (["partner_admin", "partner_staff"].includes(rol))
      tiles.push({ title: "Analytics", subtitle: "Rapportages en inzichten", icon: BarChart3, color: "bg-warning-light text-warning", to: "/analytics" });
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol))
      tiles.push({ title: "Klanten", subtitle: "Klantendatabase", icon: UserCheck2, color: "bg-accent text-accent-foreground", to: "/klanten" });
    return tiles;
  };

  /* ─── Stats for stat bar ─── */
  const getStatItems = () => {
    const items: { label: string; value: number | string }[] = [];
    if (rol === "superadmin") {
      items.push({ label: "Partners", value: s.partners ?? 0 }, { label: "Gebruikers", value: s.users ?? 0 });
    }
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol)) {
      items.push({ label: "Leads", value: s.leads ?? 0 }, { label: "Offertes", value: s.offertes ?? 0 });
    }
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol)) {
      items.push({ label: "Openstaand", value: s.openOffertes ?? 0 });
    }
    if (["superadmin", "partner_admin", "partner_staff"].includes(rol)) {
      items.push({ label: "Schouwen", value: s.schouwen ?? 0 }, { label: "Conversie", value: `${s.conversie ?? 0}%` });
    }
    if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol)) {
      items.push({ label: "Vandaag", value: s.afspraken ?? 0 });
    }
    if (rol === "installateur") {
      items.push({ label: "Opdrachten", value: s.installaties ?? 0 }, { label: "Gepland", value: s.gepland ?? 0 });
    }
    if (rol === "consument") {
      items.push({ label: "Offertes", value: s.offertes ?? 0 }, { label: "Schouwen", value: s.schouwen ?? 0 });
    }
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{dash.title}</h1>
        <p className="text-muted-foreground mt-1">{dash.description}</p>
      </div>

      {/* Compact stat bar */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-2">
          <div className="flex flex-wrap justify-center divide-x divide-border">
            {getStatItems().map((item) => (
              <MiniStat key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {getModuleTiles().map((tile) => (
          <ModuleTile key={tile.title} {...tile} />
        ))}
      </div>

      {/* Bottom row: Activity + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recente activiteit */}
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
                      <div className={`h-7 w-7 rounded-full bg-muted flex items-center justify-center ${typeColors[item.type]}`}>
                        <Icon className="h-3.5 w-3.5" />
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

        {/* Notificaties */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notificaties
              </CardTitle>
              {(notifications?.length ?? 0) > 0 && (
                <span className="text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-medium">
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
    </div>
  );
};

export default Dashboard;
