import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package2, ShieldCheck } from "lucide-react";
import { useSerienummersVoorKlant } from "@/hooks/logistiek/useSerienummers";

interface Props {
  klantId?: string | null;
  leadId?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  voorraad: "Op voorraad",
  geleverd: "Geleverd",
  geinstalleerd: "Geïnstalleerd",
  retour: "Retour",
  defect: "Defect",
};

const GeleverdeApparatuurLijst = ({ klantId, leadId }: Props) => {
  const { data: items = [], isLoading } = useSerienummersVoorKlant(klantId, leadId);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package2 className="h-5 w-5 text-primary" /> Geleverde apparatuur
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen apparatuur met serienummer geregistreerd.</p>
        ) : (
          <div className="space-y-2">
            {items.map((s) => {
              const garantieActief = s.garantie_einddatum ? new Date(s.garantie_einddatum) > new Date() : false;
              return (
                <div key={s.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {s.product_naam ?? "Product"}
                      {s.product_merk && <span className="text-muted-foreground"> · {s.product_merk}</span>}
                      {s.product_model && <span className="text-muted-foreground"> {s.product_model}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SN: <span className="font-mono">{s.serienummer}</span>
                      {s.levering_datum && ` · Geleverd ${new Date(s.levering_datum).toLocaleDateString("nl-NL")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{STATUS_LABEL[s.status] ?? s.status}</Badge>
                    {s.garantie_einddatum && (
                      <Badge className={garantieActief ? "bg-success-light text-success" : "bg-muted text-foreground"}>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {garantieActief ? `Garantie t/m ${new Date(s.garantie_einddatum).toLocaleDateString("nl-NL")}` : "Garantie verlopen"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeleverdeApparatuurLijst;