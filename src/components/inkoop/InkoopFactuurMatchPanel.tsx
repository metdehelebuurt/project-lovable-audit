import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, GitMerge, Link2, Unlink } from "lucide-react";
import { formatCurrency } from "@/types/offerte";
import {
  useInkoopFactuurMatch,
  useKoppelInkoopfactuurAanOrder,
  useGoedkeurenMatch,
  useOpenInkoopOrdersVoorLeverancier,
} from "@/hooks/inkoop/useInkoopFactuurMatch";

interface Props {
  inkoopfactuurId: string;
  partnerId: string;
  leverancierId: string | null;
  inkooporderId: string | null;
}

const statusBadge: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", className: "bg-muted text-muted-foreground", icon: GitMerge },
  akkoord: { label: "Akkoord", className: "bg-success-light text-success border-success/30", icon: CheckCircle2 },
  discrepantie: { label: "Discrepantie", className: "bg-warning/10 text-warning-foreground border-warning/30", icon: AlertTriangle },
  goedgekeurd_handmatig: { label: "Handmatig goedgekeurd", className: "bg-primary/10 text-primary border-primary/30", icon: CheckCircle2 },
};

export default function InkoopFactuurMatchPanel({ inkoopfactuurId, partnerId, leverancierId, inkooporderId }: Props) {
  const { data: match } = useInkoopFactuurMatch(inkoopfactuurId);
  const { data: openOrders = [] } = useOpenInkoopOrdersVoorLeverancier(partnerId, leverancierId);
  const koppel = useKoppelInkoopfactuurAanOrder(inkoopfactuurId);
  const goedkeuren = useGoedkeurenMatch(inkoopfactuurId);

  const [keuze, setKeuze] = useState<string>("");
  const [notitie, setNotitie] = useState<string>("");

  const status = match?.status ?? "open";
  const meta = statusBadge[status] ?? statusBadge.open;
  const Icon = meta.icon;

  const verschilLabel = match
    ? match.verschil_bedrag === 0
      ? "Geen verschil"
      : `${match.verschil_bedrag > 0 ? "+" : ""}${formatCurrency(match.verschil_bedrag)}`
    : "—";

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-primary" /> 3-way match
        </CardTitle>
        <Badge variant="outline" className={meta.className}>
          <Icon className="h-3 w-3 mr-1" /> {meta.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {!inkooporderId ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Koppel deze inkoopfactuur aan een open inkooporder van dezelfde leverancier om automatisch te matchen.
            </div>
            {openOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                Geen open inkooporders gevonden voor deze leverancier.
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Inkooporder</Label>
                  <Select value={keuze} onValueChange={setKeuze}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kies een inkooporder" />
                    </SelectTrigger>
                    <SelectContent>
                      {openOrders.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.documentnummer} — {formatCurrency(Number(o.totaal_bedrag))} ({o.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => keuze && koppel.mutate(keuze)}
                  disabled={!keuze || koppel.isPending}
                  size="sm"
                >
                  <Link2 className="h-4 w-4 mr-1" /> Koppelen
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Besteld" value={formatCurrency(Number(match?.totaal_besteld ?? 0))} />
              <Stat label="Ontvangen" value={formatCurrency(Number(match?.totaal_ontvangen ?? 0))} />
              <Stat label="Gefactureerd" value={formatCurrency(Number(match?.totaal_gefactureerd ?? 0))} />
            </div>
            <div className="rounded-lg border p-3 bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-medium">Verschil factuur vs. order</span>
              <span className={`text-sm font-semibold ${Math.abs(Number(match?.verschil_bedrag ?? 0)) < 0.01 ? "text-success" : "text-warning-foreground"}`}>
                {verschilLabel}
              </span>
            </div>

            {status === "discrepantie" && (
              <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <div className="text-sm font-medium text-warning-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Discrepantie gedetecteerd
                </div>
                <p className="text-xs text-muted-foreground">
                  Controleer of de factuur klopt met de bestelling en ontvangst. Keur handmatig goed met een toelichting als het verschil aanvaardbaar is.
                </p>
                <Textarea
                  value={notitie}
                  onChange={(e) => setNotitie(e.target.value)}
                  placeholder="Toelichting (bijv. extra verzendkosten, prijsafwijking)"
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={() => match && goedkeuren.mutate({ matchId: match.id, notitie })}
                  disabled={goedkeuren.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Handmatig goedkeuren
                </Button>
              </div>
            )}

            {status === "goedgekeurd_handmatig" && match?.notitie && (
              <div className="text-xs text-muted-foreground italic border-l-2 border-primary pl-3">
                Toelichting: {match.notitie}
              </div>
            )}

            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => koppel.mutate(null)}
                disabled={koppel.isPending}
                className="text-xs text-muted-foreground"
              >
                <Unlink className="h-3 w-3 mr-1" /> Koppeling verbreken
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  );
}