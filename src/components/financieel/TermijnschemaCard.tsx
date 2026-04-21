import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, Plus, Receipt, Settings2 } from "lucide-react";
import { formatCurrency } from "@/types/offerte";
import { getTermijnschema, TRIGGER_LABELS, type TermijnschemaRecord } from "@/lib/termijnschema";
import TermijnschemaWizard from "./TermijnschemaWizard";

interface Props {
  offerteId: string;
  offerteTotaal: number;
  partnerId: string;
}

export default function TermijnschemaCard({ offerteId, offerteTotaal, partnerId }: Props) {
  const navigate = useNavigate();
  const [termijnen, setTermijnen] = useState<TermijnschemaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getTermijnschema(offerteId);
      setTermijnen(data);
    } catch {
      setTermijnen([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [offerteId]);

  const gefactureerd = termijnen.filter((t) => t.factuur_id).length;
  const progress = termijnen.length > 0 ? (gefactureerd / termijnen.length) * 100 : 0;
  const totaalPercentage = termijnen.reduce((s, t) => s + Number(t.percentage), 0);

  return (
    <>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" /> Termijnschema
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setWizardOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" />
            {termijnen.length === 0 ? "Instellen" : "Aanpassen"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : termijnen.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Nog geen termijnschema. Stel snel een verdeling in (30/70, 30/40/30, ...).
              </p>
              <Button size="sm" variant="outline" className="rounded-pill gap-1" onClick={() => setWizardOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Termijnschema instellen
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{gefactureerd} van {termijnen.length} gefactureerd</span>
                  <span>{totaalPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-2">
                {termijnen.map((t) => {
                  const bedrag = (offerteTotaal * Number(t.percentage)) / 100;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">#{t.volgnummer}</Badge>
                          <span className="font-medium">{t.omschrijving}</span>
                          {t.factuur_id && (
                            <Badge className="bg-success-light text-success text-xs">Gefactureerd</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.percentage}% · {formatCurrency(bedrag)}
                          {t.trigger_status && (
                            <> · {TRIGGER_LABELS[t.trigger_status as keyof typeof TRIGGER_LABELS] || t.trigger_status}</>
                          )}
                        </div>
                      </div>
                      {t.factuur_id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => navigate(`/financieel/${t.factuur_id}`)}
                        >
                          <Receipt className="h-3.5 w-3.5" /> Bekijken
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-pill gap-1"
                          onClick={() =>
                            navigate(
                              `/financieel/nieuw/verkoopfactuur?offerte_id=${offerteId}&termijn_id=${t.id}`,
                            )
                          }
                        >
                          <Plus className="h-3.5 w-3.5" /> Factureren
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TermijnschemaWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        offerteId={offerteId}
        partnerId={partnerId}
        initieel={termijnen
          .filter((t) => !t.factuur_id)
          .map((t) => ({
            omschrijving: t.omschrijving,
            percentage: Number(t.percentage),
            trigger_status: (t.trigger_status as any) || null,
          }))}
        onSaved={refresh}
      />
    </>
  );
}
