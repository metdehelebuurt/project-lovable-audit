import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, FileText, Wrench, ClipboardList } from "lucide-react";

const COLORS = ["hsl(242, 67%, 62%)", "hsl(134, 50%, 59%)", "hsl(45, 100%, 51%)", "hsl(4, 90%, 58%)", "hsl(200, 60%, 50%)"];

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) => (
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

const Analytics = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ leads: 0, schouwen: 0, offertes: 0, installaties: 0 });
  const [leadsByStatus, setLeadsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [offertesByStatus, setOffertesByStatus] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const [leads, schouwen, offertes, installaties] = await Promise.all([
        supabase.from("leads").select("id, lead_status"),
        supabase.from("schouwen").select("id"),
        supabase.from("offertes").select("id, status, totaal_bedrag"),
        supabase.from("installaties").select("id"),
      ]);

      setStats({
        leads: leads.data?.length ?? 0,
        schouwen: schouwen.data?.length ?? 0,
        offertes: offertes.data?.length ?? 0,
        installaties: installaties.data?.length ?? 0,
      });

      // Lead status distribution
      const leadCounts: Record<string, number> = {};
      (leads.data ?? []).forEach((l) => {
        leadCounts[l.lead_status] = (leadCounts[l.lead_status] ?? 0) + 1;
      });
      setLeadsByStatus(Object.entries(leadCounts).map(([name, value]) => ({ name, value })));

      // Offerte status distribution
      const offerteCounts: Record<string, number> = {};
      (offertes.data ?? []).forEach((o) => {
        offerteCounts[o.status] = (offerteCounts[o.status] ?? 0) + 1;
      });
      setOffertesByStatus(Object.entries(offerteCounts).map(([name, value]) => ({ name, value })));

      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Overzicht van uw prestaties en statistieken</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leads" value={stats.leads} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard title="Schouwen" value={stats.schouwen} icon={ClipboardList} color="bg-success-light text-success" />
        <StatCard title="Offertes" value={stats.offertes} icon={FileText} color="bg-warning-light text-warning-foreground" />
        <StatCard title="Installaties" value={stats.installaties} icon={Wrench} color="bg-accent text-accent-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Leads per status</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsByStatus.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nog geen data beschikbaar</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={leadsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(242, 67%, 62%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Offertes per status</CardTitle>
          </CardHeader>
          <CardContent>
            {offertesByStatus.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nog geen data beschikbaar</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={offertesByStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {offertesByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
