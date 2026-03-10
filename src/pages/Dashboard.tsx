import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ClipboardList, FileText, Wrench, TrendingUp } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) => (
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{dash.title}</h1>
        <p className="text-muted-foreground mt-1">{dash.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rol === "superadmin" && (
          <>
            <StatCard title="Partners" value="—" icon={Building2} color="bg-primary/10 text-primary" />
            <StatCard title="Gebruikers" value="—" icon={Users} color="bg-success-light text-success" />
            <StatCard title="Leads" value="—" icon={TrendingUp} color="bg-warning-light text-warning" />
            <StatCard title="Offertes" value="—" icon={FileText} color="bg-accent text-accent-foreground" />
          </>
        )}
        {(rol === "partner_admin" || rol === "partner_staff") && (
          <>
            <StatCard title="Leads" value="—" icon={Users} color="bg-primary/10 text-primary" />
            <StatCard title="Schouwen" value="—" icon={ClipboardList} color="bg-success-light text-success" />
            <StatCard title="Offertes" value="—" icon={FileText} color="bg-warning-light text-warning" />
            <StatCard title="Installaties" value="—" icon={Wrench} color="bg-accent text-accent-foreground" />
          </>
        )}
        {rol === "adviseur" && (
          <>
            <StatCard title="Mijn Leads" value="—" icon={Users} color="bg-primary/10 text-primary" />
            <StatCard title="Schouwen" value="—" icon={ClipboardList} color="bg-success-light text-success" />
            <StatCard title="Offertes" value="—" icon={FileText} color="bg-warning-light text-warning" />
          </>
        )}
        {rol === "installateur" && (
          <>
            <StatCard title="Opdrachten" value="—" icon={Wrench} color="bg-primary/10 text-primary" />
            <StatCard title="Gepland" value="—" icon={ClipboardList} color="bg-success-light text-success" />
          </>
        )}
        {rol === "consument" && (
          <>
            <StatCard title="Offertes" value="—" icon={FileText} color="bg-primary/10 text-primary" />
            <StatCard title="Schouwen" value="—" icon={ClipboardList} color="bg-success-light text-success" />
          </>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recente Activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nog geen activiteiten om weer te geven.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
