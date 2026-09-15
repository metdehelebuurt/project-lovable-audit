import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Ban, Eye, History, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import BlokkeerDialog from "@/components/administratie/BlokkeerDialog";
import BlokkadeHistorie from "@/components/administratie/BlokkadeHistorie";
import BlokkadeScherm from "@/components/administratie/BlokkadeScherm";
import { usePartnerKlantDetail } from "@/hooks/administratie/usePartnerKlantDetail";

const euro = (bedrag: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(bedrag);

const datum = (waarde: string | null) =>
  waarde ? format(new Date(waarde), "d MMM yyyy", { locale: nl }) : "—";

function Kengetal({ label, waarde }: { label: string; waarde: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{waarde}</CardContent>
    </Card>
  );
}

export default function AdminKlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePartnerKlantDetail(id);
  const [blokkeerOpen, setBlokkeerOpen] = useState(false);
  const [historieOpen, setHistorieOpen] = useState(false);
  const [voorbeeldOpen, setVoorbeeldOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Gegevens laden...</p>;
  if (error || !data) return <p className="text-sm text-destructive">Deze klant kon niet worden geladen.</p>;

  const { partner, abonnement, gebruikers, facturen, openstaandBedrag, statistieken } = data;
  const geblokkeerd = partner.status === "geblokkeerd";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/abonnementen")}>
          <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />Terug
        </Button>
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold text-foreground">{partner.naam}</h1>
          <p className="text-muted-foreground text-sm">{partner.email ?? "Geen e-mailadres bekend"}</p>
        </div>
        <Badge variant={geblokkeerd ? "destructive" : "outline"}>{partner.status}</Badge>
        <Button variant="outline" size="sm" onClick={() => setHistorieOpen(true)}>
          <History className="h-4 w-4 mr-1" aria-hidden="true" />Geschiedenis
        </Button>
        <Button variant="outline" size="sm" onClick={() => setVoorbeeldOpen(true)}>
          <Eye className="h-4 w-4 mr-1" aria-hidden="true" />Klantweergave
        </Button>
        {geblokkeerd ? (
          <Button size="sm" onClick={() => setBlokkeerOpen(true)}>
            <ShieldCheck className="h-4 w-4 mr-1" aria-hidden="true" />Deblokkeren
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => setBlokkeerOpen(true)}>
            <Ban className="h-4 w-4 mr-1" aria-hidden="true" />Blokkeren
          </Button>
        )}
      </div>

      {geblokkeerd && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-sm space-y-1">
            <p className="font-medium text-destructive">
              Geblokkeerd op {datum(partner.geblokkeerd_op)}
            </p>
            {partner.geblokkeerd_reden && <p>Reden: {partner.geblokkeerd_reden}</p>}
            {partner.geblokkeerd_betaal_url && (
              <p className="break-all">
                Betaallink:{" "}
                <a
                  className="text-primary underline"
                  href={partner.geblokkeerd_betaal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {partner.geblokkeerd_betaal_url}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kengetal label="Openstaand" waarde={euro(openstaandBedrag)} />
        <Kengetal label="Gebruikers" waarde={gebruikers.length} />
        <Kengetal label="Leads" waarde={statistieken.leads} />
        <Kengetal label="Offertes" waarde={statistieken.offertes} />
        <Kengetal label="Opdrachten" waarde={statistieken.opdrachten} />
        <Kengetal label="Installaties" waarde={statistieken.installaties} />
        <Kengetal label="Abonnement" waarde={abonnement ? abonnement.plan : "Geen"} />
        <Kengetal
          label="Maandbedrag"
          waarde={abonnement ? euro(Number(abonnement.maand_bedrag ?? 0)) : "—"}
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Abonnement</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {abonnement ? (
            <dl className="grid gap-2 sm:grid-cols-4">
              <div><dt className="text-muted-foreground">Status</dt><dd>{abonnement.status}</dd></div>
              <div><dt className="text-muted-foreground">Interval</dt><dd>{abonnement.interval}</dd></div>
              <div><dt className="text-muted-foreground">Start</dt><dd>{datum(abonnement.start_datum)}</dd></div>
              <div><dt className="text-muted-foreground">Verloopt</dt><dd>{datum(abonnement.verloop_datum)}</dd></div>
            </dl>
          ) : (
            <p className="text-muted-foreground">Nog geen abonnement gekoppeld.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Gebruikers</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Laatste login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gebruikers.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Geen gebruikers.</TableCell></TableRow>
            )}
            {gebruikers.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <Link className="text-primary underline" to={`/gebruikers/${g.id}`}>
                    {g.voornaam} {g.achternaam}
                  </Link>
                </TableCell>
                <TableCell>{g.email}</TableCell>
                <TableCell>{g.rol}</TableCell>
                <TableCell>{g.status}</TableCell>
                <TableCell>{g.last_login_at ? format(new Date(g.last_login_at), "d MMM yyyy HH:mm", { locale: nl }) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Facturen</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Periode t/m</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Bedrag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturen.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">Geen facturen.</TableCell></TableRow>
            )}
            {facturen.map((f) => (
              <TableRow key={f.id}>
                <TableCell>{f.factuurnummer}</TableCell>
                <TableCell>{datum(f.periode_eind)}</TableCell>
                <TableCell>{f.status}</TableCell>
                <TableCell className="text-right">{euro(Number(f.totaal_bedrag ?? 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <BlokkeerDialog
        open={blokkeerOpen}
        onOpenChange={setBlokkeerOpen}
        partnerId={partner.id}
        partnerNaam={partner.naam}
        actie={geblokkeerd ? "deblokkeren" : "blokkeren"}
        openstaandBedrag={openstaandBedrag}
      />
      <BlokkadeHistorie
        open={historieOpen}
        onOpenChange={setHistorieOpen}
        partnerId={partner.id}
        partnerNaam={partner.naam}
      />

      <Dialog open={voorbeeldOpen} onOpenChange={setVoorbeeldOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Voorbeeld: dit ziet de klant</DialogTitle>
            <DialogDescription>
              Weergave van het blokkadescherm met de huidige gegevens.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center bg-muted/40 p-4 rounded-lg">
            <BlokkadeScherm
              reden={partner.geblokkeerd_reden}
              openstaandBedrag={openstaandBedrag}
              betaalUrl={partner.geblokkeerd_betaal_url}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
