import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Navigation, PlayCircle, Pause, CheckCircle2, ShieldCheck, MapPin, BookOpen, ExternalLink, Wrench } from "lucide-react";
import { useInstallatie } from "@/components/installaties/useInstallatie";
import { useInstallatieActies } from "@/components/installaties/useInstallatieActies";
import InstallatieStatusBadge from "@/components/installaties/InstallatieStatusBadge";
import type { InstallatieStatus } from "@/components/installaties/status";
import { fetchHandleidingenVoorInstallatie } from "@/lib/productHandleidingen";

const InstallatieMonteurView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: installatie, isLoading } = useInstallatie(id);
  const acties = useInstallatieActies(id);
  const [gereedNotitie, setGereedNotitie] = useState("");

  const { data: handleidingen = [] } = useQuery({
    queryKey: ["monteur-handleidingen", id],
    queryFn: () => fetchHandleidingenVoorInstallatie(id!),
    enabled: !!id,
  });
  const installatieDocs = handleidingen.filter((h) => h.type === "installatie");

  if (isLoading) return <div className="p-6 text-muted-foreground">Laden...</div>;
  if (!installatie) return <div className="p-6 text-muted-foreground">Installatie niet gevonden</div>;

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
          <Button onClick={acties.markeerOnderweg} disabled={installatie.status === "onderweg" || acties.isPending} className="w-full gap-2" variant="outline">
            <Navigation className="h-4 w-4" /> Onderweg
          </Button>
          <Button onClick={acties.markeerGestart} disabled={installatie.status === "in_uitvoering" || acties.isPending} className="w-full gap-2">
            <PlayCircle className="h-4 w-4" /> Aangekomen / starten
          </Button>
          <Button onClick={acties.markeerPauze} disabled={acties.isPending} className="w-full gap-2" variant="outline">
            <Pause className="h-4 w-4" /> Pauzeren
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Installatiehandleidingen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {installatieDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen handleidingen gekoppeld aan de producten.</p>
          ) : (
            installatieDocs.map((h) => (
              <Button
                key={`${h.product_id}-${h.type}`}
                variant="outline"
                asChild
                className="w-full justify-start gap-2 h-auto py-2"
              >
                <a href={h.url} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 text-left min-w-0">
                    <span className="block text-sm truncate">{h.product_naam}</span>
                    <span className="block text-[10px] text-muted-foreground truncate">{h.bestandsnaam}</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </Button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Gereedmelding</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={gereedNotitie} onChange={(e) => setGereedNotitie(e.target.value)} placeholder="Eventuele notitie / bijzonderheden" rows={3} />
          <Button onClick={() => acties.gereedMelden(gereedNotitie)} disabled={acties.isPending} className="w-full gap-2">
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