import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, ShoppingCart, Send, CheckCircle2, AlertTriangle, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useInkoopVoorstellen, useGenereerVoorstellen, useVoorstellenNaarConcept, useNegeerVoorstel,
} from "@/hooks/inkoop/useInkoopVoorstellen";
import { useInkoopOrders } from "@/hooks/inkoop/useInkoopOrders";

const STATUS_LABEL: Record<string, string> = {
  concept: "Concept",
  wacht_goedkeuring: "Wacht op goedkeuring",
  verzonden: "Verzonden",
  deels_ontvangen: "Deels ontvangen",
  volledig_ontvangen: "Volledig ontvangen",
  betaald: "Betaald",
  geannuleerd: "Geannuleerd",
};

const STATUS_COLOR: Record<string, string> = {
  concept: "bg-muted text-muted-foreground",
  wacht_goedkeuring: "bg-warning-light text-warning",
  verzonden: "bg-primary/10 text-primary",
  deels_ontvangen: "bg-warning-light text-warning",
  volledig_ontvangen: "bg-success-light text-success",
  betaald: "bg-success-light text-success",
  geannuleerd: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_COLOR[status] ?? "bg-muted text-muted-foreground"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

const fmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

function VoorstellenTab({ partnerId }: { partnerId: string }) {
  const { data: voorstellen = [], isLoading } = useInkoopVoorstellen(partnerId);
  const genereer = useGenereerVoorstellen(partnerId);
  const naarConcept = useVoorstellenNaarConcept(partnerId);
  const negeer = useNegeerVoorstel(partnerId);
  const [gekozen, setGekozen] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setGekozen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const groepen = useMemo(() => {
    const m = new Map<string, typeof voorstellen>();
    voorstellen.forEach((v) => {
      const key = v.leverancier?.naam ?? "Geen voorkeursleverancier";
      const arr = m.get(key) ?? [];
      arr.push(v);
      m.set(key, arr);
    });
    return Array.from(m.entries());
  }, [voorstellen]);

  const kanVerwerken = useMemo(
    () => Array.from(gekozen).some((id) => voorstellen.find((v) => v.id === id)?.leverancier_id),
    [gekozen, voorstellen],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {voorstellen.length} open voorstellen op basis van tekorten en minimumvoorraad.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => genereer.mutate()} disabled={genereer.isPending}>
            {genereer.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Voorstellen herberekenen
          </Button>
          <Button
            size="sm"
            disabled={!kanVerwerken || naarConcept.isPending}
            onClick={() => naarConcept.mutate(Array.from(gekozen), { onSuccess: () => setGekozen(new Set()) })}
          >
            {naarConcept.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            Concept-inkooporder van selectie ({gekozen.size})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : voorstellen.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
          Geen openstaande voorstellen. Klik op "Voorstellen herberekenen" om de voorraad opnieuw te scannen.
        </CardContent></Card>
      ) : (
        groepen.map(([naam, items]) => (
          <Card key={naam}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> {naam}
                <Badge variant="outline" className="ml-2">{items.length} regel(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Reden</TableHead>
                    <TableHead className="text-right">Aantal</TableHead>
                    <TableHead className="text-right">Inkoopprijs</TableHead>
                    <TableHead className="text-right">Subtotaal</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Checkbox
                          checked={gekozen.has(v.id)}
                          onCheckedChange={() => toggle(v.id)}
                          disabled={!v.leverancier_id}
                          aria-label="Selecteer voorstel"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{v.product?.naam ?? "Onbekend"}</div>
                        {!v.leverancier_id && (
                          <div className="text-xs text-warning flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Geen voorkeursleverancier ingesteld
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.reden === "tekort_opdracht"
                          ? <Badge variant="outline">Tekort opdracht</Badge>
                          : v.reden === "onder_minimum"
                            ? <Badge variant="outline">Onder min.voorraad</Badge>
                            : <Badge variant="outline">Handmatig</Badge>}
                      </TableCell>
                      <TableCell className="text-right">{v.aantal} {v.product?.eenheid ?? ""}</TableCell>
                      <TableCell className="text-right">{v.inkoopprijs ? fmt(v.inkoopprijs) : "—"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {v.inkoopprijs ? fmt(v.inkoopprijs * v.aantal) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => negeer.mutate(v.id)}>
                          Negeer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ActieveOrdersTab({ partnerId }: { partnerId: string }) {
  const { data: orders = [], isLoading } = useInkoopOrders(partnerId, {
    status: ["concept", "wacht_goedkeuring", "verzonden", "deels_ontvangen"],
  });

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (orders.length === 0) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Geen actieve inkooporders.</CardContent></Card>;
  }

  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Leverancier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gewenste lever.</TableHead>
              <TableHead className="text-right">Totaal</TableHead>
              <TableHead className="text-right">Verzonden</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow
                key={o.id}
                onClick={() => navigate(`/financieel/${o.id}`)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{o.documentnummer}</TableCell>
                <TableCell>{o.leverancier?.naam ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell>{o.gewenste_leverdatum ?? "—"}</TableCell>
                <TableCell className="text-right">{fmt(Number(o.totaal_bedrag))}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {o.verzonden_op ? new Date(o.verzonden_op).toLocaleDateString("nl-NL") : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/financieel/${o.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AfgerondTab({ partnerId }: { partnerId: string }) {
  const { data: orders = [], isLoading } = useInkoopOrders(partnerId, {
    status: ["volledig_ontvangen", "betaald", "geannuleerd"],
  });
  const navigate = useNavigate();
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (orders.length === 0) return <Card><CardContent className="py-10 text-center text-muted-foreground">Nog geen afgeronde inkooporders.</CardContent></Card>;
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Leverancier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Totaal</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow
                key={o.id}
                onClick={() => navigate(`/financieel/${o.id}`)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{o.documentnummer}</TableCell>
                <TableCell>{o.leverancier?.naam ?? "—"}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell className="text-right">{fmt(Number(o.totaal_bedrag))}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button asChild variant="ghost" size="sm"><Link to={`/financieel/${o.id}`}>Open</Link></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Inkoop() {
  const { profile } = useAuth();
  const partnerId = profile?.partner_id;

  if (!partnerId) {
    return <div className="p-6 text-muted-foreground">Geen organisatie gekoppeld aan dit account.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inkoop</h1>
          <p className="text-muted-foreground text-sm">
            Slimme voorstellen, actieve inkooporders en verzending naar leveranciers.
          </p>
        </div>
        <Button asChild>
          <Link to="/inkoop/nieuw">
            <Send className="h-4 w-4 mr-2" /> Nieuwe inkooporder
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="voorstellen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="voorstellen">Voorstellen</TabsTrigger>
          <TabsTrigger value="actief">Actieve orders</TabsTrigger>
          <TabsTrigger value="afgerond">Afgerond</TabsTrigger>
        </TabsList>
        <TabsContent value="voorstellen"><VoorstellenTab partnerId={partnerId} /></TabsContent>
        <TabsContent value="actief"><ActieveOrdersTab partnerId={partnerId} /></TabsContent>
        <TabsContent value="afgerond"><AfgerondTab partnerId={partnerId} /></TabsContent>
      </Tabs>
    </div>
  );
}