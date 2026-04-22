import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRetour, useUpdateRetourStatus, type RetourStatus } from "@/hooks/retouren/useRetouren";
import RetourStatusBadge from "@/components/retouren/RetourStatusBadge";

const flow: RetourStatus[] = ["aangemeld", "goedgekeurd", "verzonden", "ontvangen", "afgehandeld"];

export default function RetourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: retour, isLoading } = useRetour(id);
  const update = useUpdateRetourStatus();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!retour) return <div className="p-8 text-center text-muted-foreground">Niet gevonden</div>;

  const huidigeIndex = flow.indexOf(retour.status as RetourStatus);
  const volgende = huidigeIndex >= 0 && huidigeIndex < flow.length - 1 ? flow[huidigeIndex + 1] : null;

  const setStatus = (status: RetourStatus) =>
    update.mutate({ id: retour.id, status, afgehandeld_door: profile?.id ?? null });

  const relatieNaam = retour.type === "klant_retour"
    ? (retour.klanten?.bedrijfsnaam || `${retour.klanten?.voornaam ?? ""} ${retour.klanten?.achternaam ?? ""}`.trim() || "—")
    : (retour.leveranciers?.naam || "—");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/retouren")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{retour.rma_nummer}</h1>
            <RetourStatusBadge status={retour.status as RetourStatus} />
            <Badge variant="outline">
              {retour.type === "klant_retour" ? "Klantretour" : "Leveranciersretour"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{relatieNaam}</p>
        </div>
        <div className="flex gap-2">
          {volgende && (
            <Button onClick={() => setStatus(volgende)} disabled={update.isPending}>
              Naar: {volgende}
            </Button>
          )}
          {retour.status !== "afgewezen" && retour.status !== "afgehandeld" && (
            <Button variant="outline" onClick={() => setStatus("afgewezen")}>
              Afwijzen
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Geretourneerde producten</CardTitle></CardHeader>
          <CardContent>
            {(retour.regels as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen regels</p>
            ) : (
              <div className="space-y-2">
                {(retour.regels as any[]).map((r, i) => (
                  <div key={i} className="flex justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{r.omschrijving}</div>
                      {r.serienummer && <div className="text-xs text-muted-foreground">SN: {r.serienummer}</div>}
                    </div>
                    <div>{r.aantal} stuks</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Reden</div>
              <div>{retour.reden}</div>
            </div>
            {retour.oplossing && (
              <div>
                <div className="text-muted-foreground text-xs">Gewenste oplossing</div>
                <div>{retour.oplossing}</div>
              </div>
            )}
            {retour.notities && (
              <div>
                <div className="text-muted-foreground text-xs">Notities</div>
                <div>{retour.notities}</div>
              </div>
            )}
            <div className="text-xs text-muted-foreground border-t pt-2">
              Aangemaakt op {new Date(retour.created_at).toLocaleString("nl-NL")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}