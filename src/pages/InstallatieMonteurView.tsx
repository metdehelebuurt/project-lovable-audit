import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Navigation, PlayCircle, Pause, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useInstallatie } from "@/components/installaties/useInstallatie";
import InstallatieStatusBadge from "@/components/installaties/InstallatieStatusBadge";
import type { InstallatieStatus } from "@/components/installaties/status";

const InstallatieMonteurView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: installatie, isLoading, update, refetch } = useInstallatie(id);
  const [gereedNotitie, setGereedNotitie] = useState("");

  if (isLoading) return <div className="p-6 text-muted-foreground">Laden...</div>;
  if (!installatie) return <div className="p-6 text-muted-foreground">Installatie niet gevonden</div>;

  const setStatus = async (status: InstallatieStatus, extra: Record<string, unknown> = {}) => {
    try {
      await update.mutateAsync({ status, ...extra });
      await refetch();
      toast.success("Status bijgewerkt");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const gereedMelden = async () => {
    await setStatus("gereed", {
      gereedmelding_op: new Date().toISOString(),
      gereedmelding_notitie: gereedNotitie || null,
      werkelijke_eindtijd: new Date().toISOString(),
    });
  };

  const naarOplevering = () => {
    const params = new URLSearchParams({ installatie: installatie.id });
    if (installatie.klant_id) params.set("klant", installatie.klant_id);
    navigate(`/opleveringen/nieuw?${params.toString()}`);
  };

  const adres = installatie.werkadres ?? installatie.klant_adres ?? "";
  const mapsUrl = adres ? `https://maps.google.com/?q=${encodeURIComponent(adres)}` : null;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/installaties/${installatie.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{installatie.consument_naam}</h1>
          <InstallatieStatusBadge status={installatie.status as InstallatieStatus} />
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Locatie</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{adres || "Geen adres"}</p>
          {mapsUrl && (
            <Button variant="outline" size="sm" asChild className="w-full gap-2">
              <a href={mapsUrl} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" /> Navigatie openen</a>
            </Button>
          )}
          {installatie.werkomschrijving && (
            <p className="text-sm text-muted-foreground border-t pt-2 mt-2">{installatie.werkomschrijving}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Voortgang</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => setStatus("onderweg")} disabled={installatie.status === "onderweg"} className="w-full gap-2" variant="outline">
            <Navigation className="h-4 w-4" /> Onderweg
          </Button>
          <Button onClick={() => setStatus("in_uitvoering", { werkelijke_starttijd: new Date().toISOString() })} disabled={installatie.status === "in_uitvoering"} className="w-full gap-2">
            <PlayCircle className="h-4 w-4" /> Aangekomen / starten
          </Button>
          <Button onClick={() => setStatus("bevestigd")} className="w-full gap-2" variant="outline">
            <Pause className="h-4 w-4" /> Pauzeren
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Gereedmelding</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={gereedNotitie} onChange={(e) => setGereedNotitie(e.target.value)} placeholder="Eventuele notitie / bijzonderheden" rows={3} />
          <Button onClick={gereedMelden} className="w-full gap-2">
            <CheckCircle2 className="h-4 w-4" /> Gereed melden
          </Button>
          {(installatie.status === "gereed" || installatie.status === "in_uitvoering") && (
            <Button onClick={naarOplevering} className="w-full gap-2" variant="default">
              <ShieldCheck className="h-4 w-4" /> Opleverrapport maken
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallatieMonteurView;