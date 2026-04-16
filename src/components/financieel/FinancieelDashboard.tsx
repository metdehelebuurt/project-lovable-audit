import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/types/offerte";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, BarChart3, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

interface Props {
  docs: any[];
  loading: boolean;
}

export function FinancieelDashboard({ docs, loading }: Props) {
  const verkoop = useMemo(() => docs.filter((d) => d.type === "verkoopfactuur"), [docs]);
  const inkoop = useMemo(() => docs.filter((d) => d.type === "inkoopfactuur"), [docs]);

  const omzetBetaald = useMemo(() => verkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.totaal_bedrag, 0), [verkoop]);
  const totaalKosten = useMemo(() => inkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.totaal_bedrag, 0), [inkoop]);

  const maandData = useMemo(() => {
    const now = new Date();
    const months: { label: string; omzet: number; kosten: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" });
      const omzet = verkoop
        .filter((doc) => doc.status === "betaald" && new Date(doc.factuurdatum).getFullYear() === y && new Date(doc.factuurdatum).getMonth() === m)
        .reduce((s, doc) => s + doc.totaal_bedrag, 0);
      const kosten = inkoop
        .filter((doc) => doc.status === "betaald" && new Date(doc.factuurdatum).getFullYear() === y && new Date(doc.factuurdatum).getMonth() === m)
        .reduce((s, doc) => s + doc.totaal_bedrag, 0);
      months.push({ label, omzet, kosten });
    }
    return months;
  }, [docs, verkoop, inkoop]);

  const cashflowData = useMemo(() => {
    let cumulative = 0;
    return maandData.map((m) => {
      cumulative += m.omzet - m.kosten;
      return { label: m.label, cashflow: cumulative };
    });
  }, [maandData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const openstaandVerkoop = verkoop.filter((d) => ["verzonden", "verlopen"].includes(d.status)).reduce((s, d) => s + d.totaal_bedrag, 0);
  const openstaandInkoop = inkoop.filter((d) => ["ontvangen", "goedgekeurd"].includes(d.status)).reduce((s, d) => s + d.totaal_bedrag, 0);
  const verlopenCount = verkoop.filter((d) => d.status === "verlopen").length;

  const btwVerkoop = verkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.btw_bedrag, 0);
  const btwInkoop = inkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.btw_bedrag, 0);

  const cards = [
    { title: "Omzet (betaald)", value: formatCurrency(omzetBetaald), icon: TrendingUp, color: "text-green-600" },
    { title: "Openstaand (verkoop)", value: formatCurrency(openstaandVerkoop), icon: Clock, color: "text-blue-600" },
    { title: "Te betalen (inkoop)", value: formatCurrency(openstaandInkoop), icon: TrendingDown, color: "text-orange-600" },
    { title: "Verlopen facturen", value: verlopenCount.toString(), icon: AlertTriangle, color: verlopenCount > 0 ? "text-destructive" : "text-muted-foreground" },
  ];

  const chartConfig = {
    omzet: { label: "Omzet", color: "hsl(var(--primary))" },
    kosten: { label: "Kosten", color: "hsl(var(--destructive))" },
    cashflow: { label: "Cashflow", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Winst & Verlies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale omzet</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(omzetBetaald)}</div>
            <p className="text-xs text-muted-foreground mt-1">Betaalde verkoopfacturen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale kosten</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totaalKosten)}</div>
            <p className="text-xs text-muted-foreground mt-1">Betaalde inkoopfacturen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brutowinst</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${omzetBetaald - totaalKosten >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(omzetBetaald - totaalKosten)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Omzet minus kosten</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafieken */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Omzet & Kosten per maand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={maandData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="omzet" fill="var(--color-omzet)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kosten" fill="var(--color-kosten)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Cashflow (cumulatief)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="cashflow" stroke="var(--color-cashflow)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* BTW & Documenten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">BTW Overzicht (huidige periode)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">BTW ontvangen (verkoop)</span>
              <span className="font-medium">{formatCurrency(btwVerkoop)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BTW betaald (inkoop)</span>
              <span className="font-medium">{formatCurrency(btwInkoop)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>BTW afdracht</span>
              <span>{formatCurrency(btwVerkoop - btwInkoop)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Documenten overzicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(["verkoopfactuur", "inkoopfactuur", "inkooporder", "creditnota", "pakbon"] as const).map((type) => {
              const count = docs.filter((d) => d.type === type).length;
              const labels: Record<string, string> = {
                verkoopfactuur: "Verkoopfacturen",
                inkoopfactuur: "Inkoopfacturen",
                inkooporder: "Inkooporders",
                creditnota: "Creditnota's",
                pakbon: "Pakbonnen",
              };
              return (
                <div key={type} className="flex justify-between">
                  <span className="text-muted-foreground">{labels[type]}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
