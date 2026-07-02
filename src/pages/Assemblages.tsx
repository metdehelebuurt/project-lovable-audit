import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Copy, Pencil, Trash2, Search, Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVoorraadOverzicht } from "@/hooks/voorraad/useVoorraad";
import {
  useAssemblages,
  useAssemblageComponenten,
  useAddComponent,
  useUpdateComponent,
  useRemoveComponent,
  useDuplicateAssemblage,
} from "@/hooks/producten/useAssemblages";
import { formatCurrency } from "@/types/offerte";

export default function Assemblages() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const partnerId = profile?.partner_id;
  const { data: assemblages = [], isLoading } = useAssemblages(partnerId);
  const { data: voorraad = [] } = useVoorraadOverzicht(partnerId);
  const voorraadMap = useMemo(() => {
    const m = new Map<string, (typeof voorraad)[number]>();
    voorraad.forEach((v) => m.set(v.id, v));
    return m;
  }, [voorraad]);
  const [zoek, setZoek] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const duplicate = useDuplicateAssemblage(partnerId);

  const filtered = useMemo(() => {
    if (!zoek.trim()) return assemblages;
    const q = zoek.toLowerCase();
    return assemblages.filter(
      (a) => a.naam.toLowerCase().includes(q) || (a.merk ?? "").toLowerCase().includes(q),
    );
  }, [assemblages, zoek]);

  const createMutation = useMutation({
    mutationFn: async (naam: string) => {
      const { data, error } = await supabase
        .from("producten")
        .insert({
          partner_id: partnerId,
          naam,
          categorie: "installatiemateriaal" as any,
          prijs_excl_btw: 0,
          btw_percentage: 21,
          status: "actief" as any,
          is_assemblage: true,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["assemblages"] });
      qc.invalidateQueries({ queryKey: ["producten"] });
      toast.success("Assemblage aangemaakt");
      setShowCreate(false);
      setActiveId(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
        <Button className="rounded-pill" onClick={() => setShowCreate(true)}>
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
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setActiveId(a.id)}>
                      <TableCell className="font-medium">
                        {a.naam}
                        {a.merk && <span className="text-xs text-muted-foreground ml-2">{a.merk}</span>}
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
                          <Button variant="ghost" size="icon" title="Bewerken" onClick={() => setActiveId(a.id)}>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe assemblage</DialogTitle></DialogHeader>
          <NewAssemblageForm onSubmit={(naam) => createMutation.mutate(naam)} pending={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {activeId && (
        <AssemblageEditorDialog
          assemblageId={activeId}
          partnerId={partnerId}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}

function NewAssemblageForm({ onSubmit, pending }: { onSubmit: (naam: string) => void; pending: boolean }) {
  const [naam, setNaam] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (naam.trim()) onSubmit(naam.trim());
      }}
      className="space-y-4"
    >
      <div>
        <Label>Naam bundel</Label>
        <Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijv. Standaardpakket 8 panelen" autoFocus />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !naam.trim()}>Aanmaken</Button>
      </DialogFooter>
    </form>
  );
}

function AssemblageEditorDialog({
  assemblageId,
  partnerId,
  onClose,
}: {
  assemblageId: string;
  partnerId?: string | null;
  onClose: () => void;
}) {
  const { data: comps = [], isLoading } = useAssemblageComponenten(assemblageId);
  const add = useAddComponent(partnerId);
  const update = useUpdateComponent();
  const remove = useRemoveComponent();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: assemblage } = useQuery({
    queryKey: ["assemblage-detail", assemblageId],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("naam, prijs_excl_btw, prijs_strategie, marge_opslag_percentage").eq("id", assemblageId).single();
      if (error) throw error;
      return data as any;
    },
  });

  const somKostprijs = comps.reduce((s, c) => s + Number(c.aantal || 0) * Number(c.component?.kostprijs || 0), 0);
  const verkoop = assemblage?.prijs_strategie === "som_componenten"
    ? somKostprijs * (1 + Number(assemblage?.marge_opslag_percentage ?? 0) / 100)
    : Number(assemblage?.prijs_excl_btw ?? 0);
  const marge = verkoop > 0 ? ((verkoop - somKostprijs) / verkoop) * 100 : 0;
  const margeKleur = marge >= 20 ? "text-success" : marge >= 10 ? "text-warning-foreground" : "text-error";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Componenten van {assemblage?.naam ?? "assemblage"}</DialogTitle></DialogHeader>

        <div className="grid grid-cols-3 gap-3 text-sm bg-muted/40 rounded-xl p-3">
          <div><span className="text-muted-foreground">Verkoopprijs:</span> <strong>{formatCurrency(verkoop)}</strong></div>
          <div><span className="text-muted-foreground">Kostprijs (som):</span> <strong>{formatCurrency(somKostprijs)}</strong></div>
          <div><span className="text-muted-foreground">Marge:</span> <strong className={margeKleur}>{marge.toFixed(1)}%</strong></div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : comps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nog geen componenten. Voeg producten toe die in deze bundel zitten.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-24">Aantal</TableHead>
                <TableHead>Kostprijs</TableHead>
                <TableHead>SN?</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comps.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.component?.naam}</div>
                    {c.component?.merk && <div className="text-xs text-muted-foreground">{c.component.merk}</div>}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={c.aantal}
                      onChange={(e) => update.mutate({ id: c.id, aantal: parseFloat(e.target.value) || 1, assemblage_id: assemblageId })}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(Number(c.aantal) * Number(c.component?.kostprijs ?? 0))}</TableCell>
                  <TableCell>{c.component?.heeft_serienummer ? <Badge variant="outline">SN</Badge> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: c.id, assemblage_id: assemblageId })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Component toevoegen
          </Button>
          <Button onClick={onClose}>Sluiten</Button>
        </DialogFooter>

        {pickerOpen && (
          <ComponentPicker
            partnerId={partnerId}
            excludeIds={[assemblageId, ...comps.map((c) => c.component_id)]}
            onPick={(product_id) => {
              add.mutate({ assemblage_id: assemblageId, component_id: product_id, aantal: 1 });
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComponentPicker({
  partnerId,
  excludeIds,
  onPick,
  onClose,
}: {
  partnerId?: string | null;
  excludeIds: string[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [zoek, setZoek] = useState("");
  const { data: producten = [] } = useQuery({
    queryKey: ["producten-picker", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("producten")
        .select("id, naam, merk, categorie, prijs_excl_btw, kostprijs")
        .eq("partner_id", partnerId!)
        .eq("is_assemblage", false)
        .eq("status", "actief")
        .order("naam")
        .limit(500);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
  const filtered = producten
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => !zoek.trim() || p.naam.toLowerCase().includes(zoek.toLowerCase()));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Kies product</DialogTitle></DialogHeader>
        <Input placeholder="Zoek..." value={zoek} onChange={(e) => setZoek(e.target.value)} />
        <div className="max-h-96 overflow-y-auto divide-y">
          {filtered.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 flex justify-between items-center"
              onClick={() => onPick(p.id)}
            >
              <div>
                <div className="font-medium">{p.naam}</div>
                <div className="text-xs text-muted-foreground">{p.merk} · {p.categorie}</div>
              </div>
              <div className="text-sm">{p.prijs_excl_btw != null ? formatCurrency(Number(p.prijs_excl_btw)) : "—"}</div>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">Geen producten gevonden.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}