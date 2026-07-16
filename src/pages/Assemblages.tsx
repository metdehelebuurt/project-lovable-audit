import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Copy, Pencil, Search, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVoorraadOverzicht } from "@/hooks/voorraad/useVoorraad";
import { useAssemblages, useDuplicateAssemblage } from "@/hooks/producten/useAssemblages";
import { formatCurrency } from "@/types/offerte";
import { CONFIGURATOR_TEMPLATES, type ConfigureerbaarType } from "@/lib/assemblage/typeTemplates";

export default function Assemblages() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const partnerId = profile?.partner_id;
  const { data: assemblages = [], isLoading } = useAssemblages(partnerId);
  const { data: voorraad = [] } = useVoorraadOverzicht(partnerId);
  const voorraadMap = useMemo(() => {
    const m = new Map<string, (typeof voorraad)[number]>();
    voorraad.forEach((v) => m.set(v.id, v));
    return m;
  }, [voorraad]);
  const [zoek, setZoek] = useState("");
  const duplicate = useDuplicateAssemblage(partnerId);

  const filtered = useMemo(() => {
    if (!zoek.trim()) return assemblages;
    const q = zoek.toLowerCase();
    return assemblages.filter(
      (a) => a.naam.toLowerCase().includes(q) || (a.merk ?? "").toLowerCase().includes(q),
    );
  }, [assemblages, zoek]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Samengestelde producten
          </h1>
          <p className="text-sm text-muted-foreground">
            Bundel meerdere producten tot één artikel dat je in offertes en facturen als één regel gebruikt.
          </p>
        </div>
        <Button className="rounded-pill" onClick={() => navigate("/producten/assemblages/nieuw")}>
          <Plus className="h-4 w-4 mr-2" /> Nieuwe assemblage
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Overzicht</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-64"
                placeholder="Zoek assemblage"
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nog geen samengestelde producten. Maak je eerste bundel aan.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Componenten</TableHead>
                  <TableHead>Verkoopprijs</TableHead>
                  <TableHead>Kostprijs (som)</TableHead>
                  <TableHead>Marge</TableHead>
                  <TableHead>Op voorraad</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const verkoop = a.prijs_strategie === "som_componenten"
                    ? (a.som_kostprijs ?? 0) * (1 + a.marge_opslag_percentage / 100)
                    : a.prijs_excl_btw ?? 0;
                  const marge = verkoop > 0 ? ((verkoop - (a.som_kostprijs ?? 0)) / verkoop) * 100 : 0;
                  const kleur = marge >= 20 ? "bg-success-light text-success" : marge >= 10 ? "bg-warning-light text-warning-foreground" : "bg-error-light text-error";
                  const v = voorraadMap.get(a.id);
                  return (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/producten/assemblages/${a.id}`)}>
                      <TableCell className="font-medium">
                        {a.naam}
                        {a.merk && <span className="text-xs text-muted-foreground ml-2">{a.merk}</span>}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const t = (a.configureerbaar_type as ConfigureerbaarType) ?? "custom";
                          const tpl = CONFIGURATOR_TEMPLATES[t];
                          return (
                            <Badge variant="outline" className="text-xs">
                              {tpl?.label ?? t}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{a.aantal_componenten ?? 0}</TableCell>
                      <TableCell>{formatCurrency(verkoop)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(a.som_kostprijs ?? 0)}</TableCell>
                      <TableCell>
                        <Badge className={kleur}>{marge.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell>
                        {v ? (
                          v.vrij > 0 ? (
                            <Badge className="bg-success-light text-success">{v.vrij} bundels</Badge>
                          ) : (
                            <div className="text-xs text-error" title={v.bottleneck ? `Knelpunt: ${v.bottleneck.naam}` : ""}>
                              0 · {v.bottleneck ? `knelpunt ${v.bottleneck.naam}` : "geen dekking"}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Bewerken" onClick={() => navigate(`/producten/assemblages/${a.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Dupliceren" onClick={() => duplicate.mutate(a.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Naar productdetail" onClick={() => navigate(`/producten/${a.id}`)}>
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
