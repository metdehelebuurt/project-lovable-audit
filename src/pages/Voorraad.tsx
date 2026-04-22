import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, AlertTriangle } from "lucide-react";
import { useVoorraadOverzicht } from "@/hooks/voorraad/useVoorraad";
import VoorraadTabel from "@/components/voorraad/VoorraadTabel";

const Voorraad = () => {
  const { profile } = useAuth();
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<"alle" | "laag" | "gereserveerd">("alle");
  const { data: rows = [], isLoading } = useVoorraadOverzicht(profile?.partner_id);

  const stats = useMemo(() => {
    const laag = rows.filter((r) => r.min_voorraad > 0 && r.vrij <= r.min_voorraad).length;
    const gereserveerd = rows.filter((r) => r.gereserveerd > 0).length;
    const totaalProducten = rows.length;
    return { laag, gereserveerd, totaalProducten };
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (filter === "laag") r = r.filter((p) => p.min_voorraad > 0 && p.vrij <= p.min_voorraad);
    if (filter === "gereserveerd") r = r.filter((p) => p.gereserveerd > 0);
    if (zoek.trim()) {
      const q = zoek.toLowerCase();
      r = r.filter(
        (p) =>
          p.naam.toLowerCase().includes(q) ||
          (p.merk ?? "").toLowerCase().includes(q) ||
          (p.model ?? "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [rows, filter, zoek]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Voorraad</h1>
          <p className="text-sm text-muted-foreground">Overzicht en mutatiehistorie per product</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Producten</p>
              <p className="text-2xl font-semibold">{stats.totaalProducten}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-error" />
            <div>
              <p className="text-xs text-muted-foreground">Lage voorraad</p>
              <p className="text-2xl font-semibold">{stats.laag}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3">
            <Package className="h-8 w-8 text-warning-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Met reserveringen</p>
              <p className="text-2xl font-semibold">{stats.gereserveerd}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Voorraadoverzicht</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="alle">Alle</TabsTrigger>
                  <TabsTrigger value="laag">Lage voorraad</TabsTrigger>
                  <TabsTrigger value="gereserveerd">Gereserveerd</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-64"
                  placeholder="Zoek product, merk of model"
                  value={zoek}
                  onChange={(e) => setZoek(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Laden...</p>
          ) : (
            <VoorraadTabel rows={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Voorraad;
