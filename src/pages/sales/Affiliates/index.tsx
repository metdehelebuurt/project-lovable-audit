import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calendar, CheckCircle2, AlertCircle, Search, Users } from "lucide-react";
import { useAffiliatesMetDetails, type AffiliateDetails } from "@/hooks/sales/useAffiliatesMetDetails";
import { useAffiliatesMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";
import { PlanAfspraakDialog } from "../SalesAgenda/PlanAfspraakDialog";

function naam(a: AffiliateDetails): string {
  return [a.voornaam, a.achternaam].filter(Boolean).join(" ").trim() || a.email || "Onbekend";
}

function relatief(iso: string | null): string {
  if (!iso) return "—";
  const dagen = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dagen <= 0) return "vandaag";
  if (dagen === 1) return "gisteren";
  if (dagen < 30) return `${dagen} dagen geleden`;
  return new Date(iso).toLocaleDateString("nl-NL");
}

export default function SalesAffiliates() {
  const { data: affiliates = [], isLoading } = useAffiliatesMetDetails();
  const { data: kale = [] } = useAffiliatesMetAgenda();
  const [zoek, setZoek] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [planAffiliateId, setPlanAffiliateId] = useState<string | undefined>();

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return affiliates;
    return affiliates.filter((a) =>
      naam(a).toLowerCase().includes(q)
      || (a.email ?? "").toLowerCase().includes(q)
      || (a.partner_naam ?? "").toLowerCase().includes(q),
    );
  }, [affiliates, zoek]);

  const totals = useMemo(() => ({
    totaal: affiliates.length,
    metGoogle: affiliates.filter((a) => a.has_google_calendar).length,
    metOpenAfspraak: affiliates.filter((a) => a.aantal_open_afspraken > 0).length,
  }), [affiliates]);

  const openPlanner = (id: string) => {
    setPlanAffiliateId(id);
    setPlanOpen(true);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Mijn affiliates</h1>
          <p className="text-sm text-muted-foreground">
            Alle affiliates onder jouw beheer. Plan demo's of bekijk hun pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/sales/agenda"><Calendar className="h-4 w-4 mr-2" />Sales-agenda</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div><div className="text-2xl font-semibold">{totals.totaal}</div>
            <div className="text-xs text-muted-foreground">Affiliates</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div><div className="text-2xl font-semibold">{totals.metGoogle}</div>
            <div className="text-xs text-muted-foreground">Met Google-koppeling</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div><div className="text-2xl font-semibold">{totals.metOpenAfspraak}</div>
            <div className="text-xs text-muted-foreground">Met openstaande afspraak</div></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Overzicht</CardTitle>
          <div className="relative max-w-xs w-full">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek op naam, e-mail of partner…"
              className="pl-8"
              aria-label="Affiliates zoeken"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Laden…</div>
          ) : gefilterd.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Geen affiliates gevonden.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Open afspraken</TableHead>
                    <TableHead>Laatste activiteit</TableHead>
                    <TableHead>Google</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gefilterd.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{naam(a)}</div>
                        <div className="text-xs text-muted-foreground">{a.email}</div>
                      </TableCell>
                      <TableCell>
                        {a.partner_naam
                          ? <Badge variant="secondary">{a.partner_naam}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{a.aantal_leads}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.aantal_open_afspraken}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relatief(a.laatste_activiteit)}</TableCell>
                      <TableCell>
                        {a.has_google_calendar
                          ? <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Gekoppeld</Badge>
                          : <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertCircle className="h-3 w-3" />Niet gekoppeld</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openPlanner(a.id)}>
                          Plan demo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PlanAfspraakDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        affiliates={kale}
        defaultAffiliateId={planAffiliateId}
      />
    </div>
  );
}