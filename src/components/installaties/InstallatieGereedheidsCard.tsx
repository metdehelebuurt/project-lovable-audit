import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, Info, ListChecks } from "lucide-react";
import { useInstallatieGereedheid } from "@/hooks/installaties/useInstallatieGereedheid";
import type { Installatie } from "./api/installatieApi";
import { Progress } from "@/components/ui/progress";

const iconFor = (status: "ok" | "warn" | "fail" | "info") => {
  switch (status) {
    case "ok": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "warn": return <AlertTriangle className="h-4 w-4 text-warning-foreground" />;
    case "fail": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function InstallatieGereedheidsCard({ installatie }: { installatie: Installatie }) {
  const { data, isLoading } = useInstallatieGereedheid(installatie);

  if (isLoading || !data) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6 text-sm text-muted-foreground">Gereedheidscheck laden…</CardContent>
      </Card>
    );
  }

  const pct = data.totaal === 0 ? 0 : Math.round((data.ok / data.totaal) * 100);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" /> Werkvoorbereiding
          </CardTitle>
          <span className="text-sm font-medium">
            {data.ok} / {data.totaal} gereed
          </span>
        </div>
        <Progress value={pct} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {data.items.map((it) => (
            <li key={it.key} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">{iconFor(it.status)}</span>
              <div className="min-w-0 flex-1">
                <p className={it.status === "fail" ? "font-medium text-destructive" : "font-medium"}>
                  {it.label}
                  {it.manueel && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-warning-foreground font-semibold">
                      Handmatig
                    </span>
                  )}
                </p>
                {it.details && <p className="text-xs text-muted-foreground">{it.details}</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}