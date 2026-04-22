import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import {
  useLeverancierArtikelen,
  useUpsertLeverancierArtikel,
  useDeleteLeverancierArtikel,
} from "@/hooks/inkoop/useLeverancierArtikelen";

interface Props {
  partnerId: string;
  leverancierId: string;
}

interface FormState {
  id?: string;
  product_id: string;
  leverancier_artikelnummer: string;
  inkoopprijs: string;
  min_bestelhoeveelheid: string;
  levertijd_dagen: string;
  voorkeur: boolean;
  notities: string;
}

const emptyForm: FormState = {
  product_id: "",
  leverancier_artikelnummer: "",
  inkoopprijs: "0",
  min_bestelhoeveelheid: "1",
  levertijd_dagen: "7",
  voorkeur: false,
  notities: "",
};

export default function PrijslijstEditor({ partnerId, leverancierId }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [zoekProduct, setZoekProduct] = useState("");

  const { data: items = [] } = useLeverancierArtikelen({ partnerId, leverancierId });
  const upsert = useUpsertLeverancierArtikel(partnerId);
  const del = useDeleteLeverancierArtikel();

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-voor-prijslijst", partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("producten")
        .select("id, naam, eenheid, categorie, kostprijs")
        .or(`partner_id.eq.${partnerId},partner_id.is.null`)
        .order("naam");
      return data ?? [];
    },
  });

  const beschikbareProducten = useMemo(() => {
    const gekoppelde = new Set(items.map((i: any) => i.product_id));
    return producten.filter((p: any) =>
      (form.id || !gekoppelde.has(p.id)) &&
      p.naam.toLowerCase().includes(zoekProduct.toLowerCase())
    );
  }, [producten, items, form.id, zoekProduct]);

  const openNew = () => {
    setForm(emptyForm);
    setZoekProduct("");
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setForm({
      id: item.id,
      product_id: item.product_id,
      leverancier_artikelnummer: item.leverancier_artikelnummer ?? "",
      inkoopprijs: String(item.inkoopprijs ?? 0),
      min_bestelhoeveelheid: String(item.min_bestelhoeveelheid ?? 1),
      levertijd_dagen: String(item.levertijd_dagen ?? 7),
      voorkeur: !!item.voorkeur,
      notities: item.notities ?? "",
    });
    setOpen(true);
  };

  const opslaan = async () => {
    if (!form.product_id) return;
    await upsert.mutateAsync({
      id: form.id,
      leverancier_id: leverancierId,
      product_id: form.product_id,
      leverancier_artikelnummer: form.leverancier_artikelnummer || null,
      inkoopprijs: parseFloat(form.inkoopprijs) || 0,
      min_bestelhoeveelheid: parseFloat(form.min_bestelhoeveelheid) || 1,
      levertijd_dagen: parseInt(form.levertijd_dagen) || 7,
      voorkeur: form.voorkeur,
      notities: form.notities || null,
    });
    setOpen(false);
    setForm(emptyForm);
  };

  const verwijder = async (id: string) => {
    if (!confirm("Prijslijstregel verwijderen?")) return;
    await del.mutateAsync(id);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Prijslijst</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Product koppelen
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Artikelnr leverancier</TableHead>
              <TableHead className="text-right">Inkoopprijs</TableHead>
              <TableHead className="text-right">Min. bestel</TableHead>
              <TableHead className="text-right">Levertijd</TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  Nog geen producten gekoppeld aan deze leverancier
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.voorkeur && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                      {item.producten?.naam ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.leverancier_artikelnummer || "—"}</TableCell>
                  <TableCell className="text-right">€ {Number(item.inkoopprijs).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.min_bestelhoeveelheid}</TableCell>
                  <TableCell className="text-right">{item.levertijd_dagen ?? "—"} d</TableCell>
                  <TableCell>
                    {item.voorkeur && <Badge variant="outline" className="text-xs">Voorkeur</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => verwijder(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Prijslijstregel bewerken" : "Product koppelen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!form.id && (
              <div className="space-y-2">
                <Label>Product zoeken</Label>
                <Input value={zoekProduct} onChange={(e) => setZoekProduct(e.target.value)} placeholder="Typ om te zoeken..." />
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  {beschikbareProducten.slice(0, 30).map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, product_id: p.id, inkoopprijs: form.inkoopprijs === "0" && p.kostprijs ? String(p.kostprijs) : form.inkoopprijs })}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${form.product_id === p.id ? "bg-accent" : ""}`}
                    >
                      <div>{p.naam}</div>
                      <div className="text-xs text-muted-foreground">{p.categorie}</div>
                    </button>
                  ))}
                  {beschikbareProducten.length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">Geen producten</div>
                  )}
                </div>
              </div>
            )}
            {form.id && (
              <div className="text-sm text-muted-foreground">
                Product: {items.find((i: any) => i.id === form.id)?.producten?.naam ?? "—"}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Artikelnr leverancier</Label>
                <Input value={form.leverancier_artikelnummer} onChange={(e) => setForm({ ...form, leverancier_artikelnummer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Inkoopprijs €</Label>
                <Input type="number" step="0.01" value={form.inkoopprijs} onChange={(e) => setForm({ ...form, inkoopprijs: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Min. bestelhoeveelheid</Label>
                <Input type="number" step="0.01" value={form.min_bestelhoeveelheid} onChange={(e) => setForm({ ...form, min_bestelhoeveelheid: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Levertijd (dagen)</Label>
                <Input type="number" value={form.levertijd_dagen} onChange={(e) => setForm({ ...form, levertijd_dagen: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Voorkeursleverancier</Label>
                <p className="text-xs text-muted-foreground">Wordt eerst gesuggereerd bij tekorten</p>
              </div>
              <Switch checked={form.voorkeur} onCheckedChange={(v) => setForm({ ...form, voorkeur: v })} />
            </div>
            <div className="space-y-2">
              <Label>Notities</Label>
              <Input value={form.notities} onChange={(e) => setForm({ ...form, notities: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={opslaan} disabled={!form.product_id || upsert.isPending}>
              {form.id ? "Opslaan" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}