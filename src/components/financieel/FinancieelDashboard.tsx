import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/types/offerte";
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  docs: any[];
  loading: boolean;
}

export function FinancieelDashboard({ docs, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const verkoop = docs.filter((d) => d.type === "verkoopfactuur");
  const inkoop = docs.filter((d) => d.type === "inkoopfactuur");

  const omzetBetaald = verkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.totaal_bedrag, 0);
  const openstaandVerkoop = verkoop.filter((d) => ["verzonden", "verlopen"].includes(d.status)).reduce((s, d) => s + d.totaal_bedrag, 0);
  const openstaandInkoop = inkoop.filter((d) => ["ontvangen", "goedgekeurd"].includes(d.status)).reduce((s, d) => s + d.totaal_bedrag, 0);
  const verlopenCount = verkoop.filter((d) => d.status === "verlopen").length;

  const cards = [
    { title: "Omzet (betaald)", value: formatCurrency(omzetBetaald), icon: TrendingUp, color: "text-green-600" },
    { title: "Openstaand (verkoop)", value: formatCurrency(openstaandVerkoop), icon: Clock, color: "text-blue-600" },
    { title: "Te betalen (inkoop)", value: formatCurrency(openstaandInkoop), icon: TrendingDown, color: "text-orange-600" },
    { title: "Verlopen facturen", value: verlopenCount.toString(), icon: AlertTriangle, color: verlopenCount > 0 ? "text-red-600" : "text-muted-foreground" },
  ];

  // BTW summary
  const btwVerkoop = verkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.btw_bedrag, 0);
  const btwInkoop = inkoop.filter((d) => d.status === "betaald").reduce((s, d) => s + d.btw_bedrag, 0);

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
