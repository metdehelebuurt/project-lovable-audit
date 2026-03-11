import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, FileText, Wrench, ClipboardList, Euro, Percent } from "lucide-react";

const COLORS = ["hsl(242, 67%, 62%)", "hsl(134, 50%, 59%)", "hsl(45, 100%, 51%)", "hsl(4, 90%, 58%)", "hsl(200, 60%, 50%)"];

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) => (
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

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val);

const Analytics = () => {
  const { profile } = useAuth();
  const [period, setPeriod] = useState("jaar");
  const [stats, setStats] = useState({ leads: 0, schouwen: 0, offertes: 0, installaties: 0 });
  const [omzet, setOmzet] = useState(0);
  const [gemOfferteWaarde, setGemOfferteWaarde] = useState(0);
  const [conversieRatio, setConversieRatio] = useState(0);
  const [leadsByStatus, setLeadsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [offertesByStatus, setOffertesByStatus] = useState<{ name: string; value: number }[]>([]);
  const [topProducten, setTopProducten] = useState<{ name: string; aantal: number; omzet: number }[]>([]);
  const [offertesPerMaand, setOffertesPerMaand] = useState<{ maand: string; aantal: number; omzet: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case "week": startDate = new Date(now.getTime() - 7 * 86400000); break;
        case "maand": startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "kwartaal": startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
        default: startDate = new Date(now.getFullYear(), 0, 1);
      }
      const startIso = startDate.toISOString();

      const [leads, schouwen, offertes, installaties] = await Promise.all([
        supabase.from("leads").select("id, lead_status").gte("created_at", startIso),
        supabase.from("schouwen").select("id").gte("created_at", startIso),
        supabase.from("offertes").select("id, status, totaal_bedrag, regels, created_at").gte("created_at", startIso),
        supabase.from("installaties").select("id").gte("created_at", startIso),
      ]);

      const leadsData = leads.data ?? [];
      const offertesData = offertes.data ?? [];

      setStats({
        leads: leadsData.length,
        schouwen: schouwen.data?.length ?? 0,
        offertes: offertesData.length,
        installaties: installaties.data?.length ?? 0,
      });

      // Omzet (geaccepteerde offertes)
      const geaccepteerd = offertesData.filter(o => o.status === "geaccepteerd");
      const totalOmzet = geaccepteerd.reduce((s, o) => s + Number(o.totaal_bedrag), 0);
      setOmzet(totalOmzet);

      // Gemiddelde offerte waarde
      const avg = offertesData.length > 0
        ? offertesData.reduce((s, o) => s + Number(o.totaal_bedrag), 0) / offertesData.length
        : 0;
      setGemOfferteWaarde(avg);

      // Conversieratio
      const klanten = leadsData.filter(l => l.lead_status === "klant").length;
      setConversieRatio(leadsData.length > 0 ? Math.round((klanten / leadsData.length) * 100) : 0);

      // Leads per status
      const leadCounts: Record<string, number> = {};
      leadsData.forEach(l => { leadCounts[l.lead_status] = (leadCounts[l.lead_status] ?? 0) + 1; });
      setLeadsByStatus(Object.entries(leadCounts).map(([name, value]) => ({ name, value })));

      // Offertes per status
      const offerteCounts: Record<string, number> = {};
      offertesData.forEach(o => { offerteCounts[o.status] = (offerteCounts[o.status] ?? 0) + 1; });
      setOffertesByStatus(Object.entries(offerteCounts).map(([name, value]) => ({ name, value })));

      // Top producten from offerte regels
      const productMap: Record<string, { aantal: number; omzet: number }> = {};
      offertesData.forEach(o => {
        const regels = Array.isArray(o.regels) ? o.regels : [];
        regels.forEach((r: any) => {
          const naam = r.product_naam || r.beschrijving || "Onbekend";
          if (!productMap[naam]) productMap[naam] = { aantal: 0, omzet: 0 };
          productMap[naam].aantal += Number(r.aantal || 1);
          productMap[naam].omzet += Number(r.totaal || 0);
        });
      });
      setTopProducten(
        Object.entries(productMap)
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.omzet - a.omzet)
          .slice(0, 5)
      );

      // Offertes per maand
      const maandMap: Record<string, { aantal: number; omzet: number }> = {};
      offertesData.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!maandMap[key]) maandMap[key] = { aantal: 0, omzet: 0 };
        maandMap[key].aantal++;
        maandMap[key].omzet += Number(o.totaal_bedrag);
      });
      setOffertesPerMaand(
        Object.entries(maandMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([maand, v]) => ({ maand, ...v }))
      );

      setLoading(false);
    };
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Overzicht van uw prestaties en statistieken</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Deze week</SelectItem>
            <SelectItem value="maand">Deze maand</SelectItem>
            <SelectItem value="kwartaal">Dit kwartaal</SelectItem>
            <SelectItem value="jaar">Dit jaar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leads" value={stats.leads} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard title="Omzet (geaccepteerd)" value={formatCurrency(omzet)} icon={Euro} color="bg-success-light text-success" />
        <StatCard title="Gem. offerte waarde" value={formatCurrency(gemOfferteWaarde)} icon={FileText} color="bg-warning-light text-warning-foreground" />
        <StatCard title="Conversieratio" value={`${conversieRatio}%`} icon={Percent} color="bg-accent text-accent-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Offertes per maand</CardTitle></CardHeader>
          <CardContent>
            {offertesPerMaand.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nog geen data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={offertesPerMaand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="maand" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="omzet" name="Omzet" fill="hsl(242, 67%, 62%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Offertes per status</CardTitle></CardHeader>
          <CardContent>
            {offertesByStatus.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nog geen data</p>
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

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Leads per status</CardTitle></CardHeader>
          <CardContent>
            {leadsByStatus.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nog geen data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={leadsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(134, 50%, 59%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Top 5 producten (omzet)</CardTitle></CardHeader>
          <CardContent>
            {topProducten.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nog geen data</p>
            ) : (
              <div className="space-y-3">
                {topProducten.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.aantal}x verkocht</p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(p.omzet)}</p>
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

export default Analytics;
