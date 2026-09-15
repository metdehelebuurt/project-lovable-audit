import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Ban, History, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import BlokkeerDialog from "./BlokkeerDialog";
import BlokkadeHistorie from "./BlokkadeHistorie";
import {
  usePartnerAdministratie, type PartnerAdministratieRij,
} from "@/hooks/administratie/usePartnerAdministratie";

type Filter = "alle" | "achterstallig" | "geblokkeerd";

const euro = (bedrag: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(bedrag);

function BetaalBadge({ rij }: { rij: PartnerAdministratieRij }) {
  if (rij.status === "geblokkeerd") return <Badge variant="destructive">Geblokkeerd</Badge>;
  if (rij.dagen_te_laat >= 15) return <Badge variant="destructive">{rij.dagen_te_laat} dagen te laat</Badge>;
  if (rij.dagen_te_laat > 0) return <Badge variant="secondary">{rij.dagen_te_laat} dagen te laat</Badge>;
  if (rij.aantal_openstaand > 0) return <Badge variant="outline">Openstaand</Badge>;
  return <Badge variant="outline">Op tijd</Badge>;
}

function pasFilterToe(rijen: PartnerAdministratieRij[], filter: Filter, zoek: string) {
  const term = zoek.trim().toLowerCase();
  return rijen.filter((r) => {
    if (term && !r.naam.toLowerCase().includes(term)) return false;
    if (filter === "achterstallig") return r.dagen_te_laat > 0;
    if (filter === "geblokkeerd") return r.status === "geblokkeerd";
    return true;
  });
}

export default function AdministratieOverzicht() {
  const navigate = useNavigate();
  const { data = [], isLoading, error } = usePartnerAdministratie();
  const [filter, setFilter] = useState<Filter>("achterstallig");
  const [zoek, setZoek] = useState("");
  const [blokkeerDoel, setBlokkeerDoel] = useState<PartnerAdministratieRij | null>(null);
  const [historieDoel, setHistorieDoel] = useState<PartnerAdministratieRij | null>(null);

  const rijen = useMemo(() => pasFilterToe(data, filter, zoek), [data, filter, zoek]);
  const totaalOpenstaand = data.reduce((som, r) => som + r.openstaand_bedrag, 0);
  const aantalGeblokkeerd = data.filter((r) => r.status === "geblokkeerd").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Totaal openstaand</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{euro(totaalOpenstaand)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Achterstallig</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{data.filter((r) => r.dagen_te_laat > 0).length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Geblokkeerd</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{aantalGeblokkeerd}</CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["achterstallig", "geblokkeerd", "alle"] as Filter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "alle" ? "Alle klanten" : f === "achterstallig" ? "Achterstallig" : "Geblokkeerd"}
          </Button>
        ))}
        <Input
          className="max-w-xs"
          placeholder="Zoek op organisatie"
          aria-label="Zoek op organisatie"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Gegevens laden...</p>}
      {error && <p className="text-sm text-destructive">Het overzicht kon niet worden geladen.</p>}

      {!isLoading && !error && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisatie</TableHead>
                <TableHead>Betaalstatus</TableHead>
                <TableHead className="text-right">Openstaand</TableHead>
                <TableHead>Oudste factuur</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rijen.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Geen klanten in deze selectie.</TableCell></TableRow>
              )}
              {rijen.map((rij) => (
                <TableRow
                  key={rij.partner_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/abonnementen/klant/${rij.partner_id}`)}
                >
                  <TableCell>
                    <div className="font-medium text-primary underline">{rij.naam}</div>
                    {rij.geblokkeerd_reden && (
                      <div className="text-xs text-muted-foreground">Reden: {rij.geblokkeerd_reden}</div>
                    )}
                  </TableCell>
                  <TableCell><BetaalBadge rij={rij} /></TableCell>
                  <TableCell className="text-right">{euro(rij.openstaand_bedrag)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rij.oudste_factuurnummer
                      ? `${rij.oudste_factuurnummer}${rij.oudste_periode_eind ? ` — ${format(new Date(rij.oudste_periode_eind), "d MMM yyyy", { locale: nl })}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => setHistorieDoel(rij)} aria-label={`Geschiedenis ${rij.naam}`}>
                      <History className="h-4 w-4" />
                    </Button>
                    {rij.status === "geblokkeerd" ? (
                      <Button size="sm" variant="outline" onClick={() => setBlokkeerDoel(rij)}>
                        <ShieldCheck className="h-4 w-4 mr-1" />Deblokkeren
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => setBlokkeerDoel(rij)}>
                        <Ban className="h-4 w-4 mr-1" />Blokkeren
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <BlokkeerDialog
        open={!!blokkeerDoel}
        onOpenChange={(v) => { if (!v) setBlokkeerDoel(null); }}
        partnerId={blokkeerDoel?.partner_id ?? null}
        partnerNaam={blokkeerDoel?.naam ?? ""}
        actie={blokkeerDoel?.status === "geblokkeerd" ? "deblokkeren" : "blokkeren"}
        openstaandBedrag={blokkeerDoel?.openstaand_bedrag ?? 0}
      />
      <BlokkadeHistorie
        open={!!historieDoel}
        onOpenChange={(v) => { if (!v) setHistorieDoel(null); }}
        partnerId={historieDoel?.partner_id ?? null}
        partnerNaam={historieDoel?.naam ?? ""}
      />
    </div>
  );
}
