import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package, Sparkles, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];
type ProductInsert = Database["public"]["Tables"]["producten"]["Insert"];
type ProductCategorie = Database["public"]["Enums"]["product_categorie"];
type ProductStatus = Database["public"]["Enums"]["product_status"];

const categorieLabels: Record<ProductCategorie, string> = {
  zonnepanelen: "Zonnepanelen",
  thuisbatterij: "Thuisbatterij",
  warmtepomp: "Warmtepomp",
  laadpaal: "Laadpaal",
  omvormer: "Omvormer",
  accessoires: "Accessoires",
  installatiemateriaal: "Installatiemateriaal",
};

const statusLabels: Record<ProductStatus, string> = {
  actief: "Actief",
  uitgefaseerd: "Uitgefaseerd",
  niet_beschikbaar: "Niet beschikbaar",
};

const statusColors: Record<ProductStatus, string> = {
  actief: "bg-success-light text-success",
  uitgefaseerd: "bg-warning-light text-warning-foreground",
  niet_beschikbaar: "bg-error-light text-error",
};

interface ProductFormData {
  naam: string;
  categorie: ProductCategorie;
  merk: string;
  model: string;
  omschrijving: string;
  prijs_excl_btw: number;
  kostprijs: number | null;
  eenheid: string;
  voorraad: number | null;
  btw_percentage: number;
  max_korting_euro: number | null;
  max_korting_percentage: number | null;
  product_code: string;
  leverancier: string;
  artikelnummer: string;
  ean_code: string;
  levertijd: string;
  garantie_jaren: number | null;
  certificeringen: string;
  status: ProductStatus;
}

const emptyForm: ProductFormData = {
  naam: "", categorie: "zonnepanelen", merk: "", model: "",
  omschrijving: "", prijs_excl_btw: 0, kostprijs: null, eenheid: "stuk",
  voorraad: null, btw_percentage: 21, max_korting_euro: null,
  max_korting_percentage: null, product_code: "", leverancier: "",
  artikelnummer: "", ean_code: "", levertijd: "", garantie_jaren: null,
  certificeringen: "", status: "actief",
};

interface AIProduct {
  naam: string;
  model: string;
  merk: string;
  omschrijving: string;
  prijs_excl_btw: number;
  garantie_jaren?: number;
  certificeringen?: string;
  specs?: Record<string, string>;
  categorie: ProductCategorie;
}

const Producten = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const queryClient = useQueryClient();

  // AI Import state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiMerk, setAiMerk] = useState("");
  const [aiCategorie, setAiCategorie] = useState<ProductCategorie>("zonnepanelen");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProducts, setAiProducts] = useState<AIProduct[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiStep, setAiStep] = useState<"input" | "preview">("input");

  const isSuperadmin = profile?.rol === "superadmin";
  const isPartnerAdmin = profile?.rol === "partner_admin";
  const isPartnerStaff = profile?.rol === "partner_staff";
  const isInstallateur = profile?.rol === "installateur";
  const canEdit = isSuperadmin || isPartnerAdmin || isPartnerStaff || isInstallateur;

  const { data: producten = [], isLoading } = useQuery({
    queryKey: ["producten"],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").order("naam");
      if (error) throw error;
      return data as Product[];
    },
  });

  const actief = producten.filter(p => p.status === "actief").length;
  const uitgefaseerd = producten.filter(p => p.status === "uitgefaseerd").length;
  const totaalWaarde = producten.reduce((sum, p) => sum + Number(p.prijs_excl_btw), 0);

  const { data: topProducten = [] } = useQuery({
    queryKey: ["top-producten", producten],
    enabled: producten.length > 0,
    queryFn: async () => {
      const { data: offertes } = await supabase.from("offertes").select("regels");
      if (!offertes) return [];
      const counts: Record<string, number> = {};
      offertes.forEach(o => {
        const regels = o.regels as any[];
        if (Array.isArray(regels)) {
          regels.forEach((r: any) => {
            if (r.product_naam) counts[r.product_naam] = (counts[r.product_naam] || 0) + (r.aantal || 1);
          });
        }
      });
      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([naam, aantal]) => ({ naam, aantal }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string } & ProductFormData) => {
      const { id, ...rest } = data;
      const record: any = {
        ...rest,
        merk: rest.merk || null,
        model: rest.model || null,
        omschrijving: rest.omschrijving || null,
        product_code: rest.product_code || null,
        leverancier: rest.leverancier || null,
        artikelnummer: rest.artikelnummer || null,
        ean_code: rest.ean_code || null,
        levertijd: rest.levertijd || null,
        certificeringen: rest.certificeringen || null,
      };

      if (id) {
        const { error } = await supabase.from("producten").update(record).eq("id", id);
        if (error) throw error;
      } else {
        record.partner_id = isSuperadmin ? null : profile?.partner_id;
        const { error } = await supabase.from("producten").insert(record as ProductInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producten"] });
      toast.success(editingProduct ? "Product bijgewerkt" : "Product aangemaakt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("producten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producten"] });
      toast.success("Product verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openCreate = () => { setEditingProduct(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      naam: p.naam, categorie: p.categorie, merk: p.merk || "",
      model: p.model || "", omschrijving: p.omschrijving || "",
      prijs_excl_btw: Number(p.prijs_excl_btw), kostprijs: p.kostprijs ? Number(p.kostprijs) : null,
      eenheid: p.eenheid || "stuk", voorraad: p.voorraad,
      btw_percentage: p.btw_percentage ?? 21,
      max_korting_euro: p.max_korting_euro ? Number(p.max_korting_euro) : null,
      max_korting_percentage: p.max_korting_percentage ? Number(p.max_korting_percentage) : null,
      product_code: p.product_code || "", leverancier: p.leverancier || "",
      artikelnummer: p.artikelnummer || "", ean_code: p.ean_code || "",
      levertijd: p.levertijd || "", garantie_jaren: p.garantie_jaren,
      certificeringen: p.certificeringen || "", status: p.status,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingProduct(null); setForm(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingProduct ? { ...form, id: editingProduct.id } : form);
  };

  // AI Import handlers
  const handleAiSearch = async () => {
    if (!aiMerk.trim()) { toast.error("Voer een merknaam in"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-product-import", {
        body: { merk: aiMerk.trim(), categorie: aiCategorie },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const products = data?.products || [];
      if (products.length === 0) {
        toast.info("Geen producten gevonden voor dit merk en deze categorie");
        return;
      }
      setAiProducts(products);
      setAiSelected(new Set(products.map((_: any, i: number) => i)));
      setAiStep("preview");
    } catch (err: any) {
      toast.error("Fout bij ophalen producten", { description: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImport = async () => {
    const selected = aiProducts.filter((_, i) => aiSelected.has(i));
    if (selected.length === 0) { toast.error("Selecteer minimaal één product"); return; }
    setAiLoading(true);
    try {
      const records: ProductInsert[] = selected.map(p => ({
        naam: p.naam,
        model: p.model || null,
        merk: p.merk || null,
        omschrijving: p.omschrijving || null,
        prijs_excl_btw: p.prijs_excl_btw || 0,
        garantie_jaren: p.garantie_jaren || null,
        certificeringen: p.certificeringen || null,
        specs: p.specs ? (p.specs as any) : null,
        categorie: p.categorie,
        partner_id: isSuperadmin ? null : profile?.partner_id!,
        status: "actief" as const,
      }));
      const { error } = await supabase.from("producten").insert(records);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["producten"] });
      toast.success(`${selected.length} producten geïmporteerd`);
      closeAiDialog();
    } catch (err: any) {
      toast.error("Fout bij importeren", { description: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const closeAiDialog = () => {
    setAiDialogOpen(false);
    setAiMerk("");
    setAiCategorie("zonnepanelen");
    setAiProducts([]);
    setAiSelected(new Set());
    setAiStep("input");
  };

  const toggleAiSelect = (idx: number) => {
    setAiSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const filtered = producten.filter(p => {
    const matchSearch = `${p.naam} ${p.merk ?? ""} ${p.model ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "alle" || p.categorie === catFilter;
    return matchSearch && matchCat;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Producten</h1>
          <p className="text-muted-foreground mt-1">Productcatalogus beheren</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAiDialogOpen(true)} className="rounded-pill gap-2">
              <Sparkles className="h-4 w-4" /> AI Import
            </Button>
            <Button onClick={openCreate} className="rounded-pill gap-2">
              <Plus className="h-4 w-4" /> Nieuw Product
            </Button>
          </div>
        )}
      </div>

      {/* Statistieken */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Totaal</p>
            <p className="text-2xl font-bold text-foreground">{producten.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Actief</p>
            <p className="text-2xl font-bold text-foreground">{actief}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Uitgefaseerd</p>
            <p className="text-2xl font-bold text-foreground">{uitgefaseerd}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Cataloguswaarde</p>
            <p className="text-2xl font-bold text-foreground">{formatPrice(totaalWaarde)}</p>
          </CardContent>
        </Card>
      </div>

      {topProducten.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Meest verkochte producten</p>
            <div className="flex flex-wrap gap-3">
              {topProducten.map((tp, i) => (
                <Badge key={i} variant="outline" className="text-sm py-1 px-3">
                  {tp.naam} <span className="ml-1 text-muted-foreground">({tp.aantal}×)</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek producten..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle categorieën</SelectItem>
                {(Object.keys(categorieLabels) as ProductCategorie[]).map(c => (
                  <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen producten gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Merk</TableHead>
                    <TableHead>Prijs excl. BTW</TableHead>
                    <TableHead>Voorraad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scope</TableHead>
                    {canEdit && <TableHead className="text-right">Acties</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.naam}</p>
                          {product.product_code && <p className="text-xs text-muted-foreground">{product.product_code}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{categorieLabels[product.categorie]}</TableCell>
                      <TableCell>{product.merk || "—"}</TableCell>
                      <TableCell>{formatPrice(Number(product.prijs_excl_btw))}</TableCell>
                      <TableCell>{product.voorraad ?? "—"}</TableCell>
                      <TableCell><Badge className={statusColors[product.status]}>{statusLabels[product.status]}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.partner_id ? "Partner" : "Globaal"}</Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Product verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>Weet je zeker dat je "{product.naam}" wilt verwijderen?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(product.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Product bewerken" : "Nieuw product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basisgegevens</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Productnaam *</Label><Input value={form.naam} onChange={e => setForm(p => ({ ...p, naam: e.target.value }))} required className="rounded-xl" /></div>
                <div>
                  <Label>Categorie *</Label>
                  <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v as ProductCategorie }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categorieLabels) as ProductCategorie[]).map(c => (
                        <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as ProductStatus }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabels) as ProductStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Merk</Label><Input value={form.merk} onChange={e => setForm(p => ({ ...p, merk: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Model</Label><Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className="rounded-xl" /></div>
                <div className="col-span-2"><Label>Omschrijving</Label><Textarea value={form.omschrijving} onChange={e => setForm(p => ({ ...p, omschrijving: e.target.value }))} className="rounded-xl" rows={3} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Prijzen & Voorraad</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Verkoopprijs excl. BTW *</Label><Input type="number" step="0.01" value={form.prijs_excl_btw} onChange={e => setForm(p => ({ ...p, prijs_excl_btw: parseFloat(e.target.value) || 0 }))} required className="rounded-xl" /></div>
                <div><Label>Kostprijs</Label><Input type="number" step="0.01" value={form.kostprijs ?? ""} onChange={e => setForm(p => ({ ...p, kostprijs: e.target.value ? parseFloat(e.target.value) : null }))} className="rounded-xl" /></div>
                <div><Label>BTW %</Label><Input type="number" value={form.btw_percentage} onChange={e => setForm(p => ({ ...p, btw_percentage: parseInt(e.target.value) || 21 }))} className="rounded-xl" /></div>
                <div>
                  <Label>Eenheid</Label>
                  <Select value={form.eenheid} onValueChange={v => setForm(p => ({ ...p, eenheid: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["stuk", "m2", "meter", "set", "uur"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Voorraad</Label><Input type="number" value={form.voorraad ?? ""} onChange={e => setForm(p => ({ ...p, voorraad: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
                <div><Label>Max korting €</Label><Input type="number" step="0.01" value={form.max_korting_euro ?? ""} onChange={e => setForm(p => ({ ...p, max_korting_euro: e.target.value ? parseFloat(e.target.value) : null }))} className="rounded-xl" /></div>
                <div><Label>Max korting %</Label><Input type="number" step="0.1" value={form.max_korting_percentage ?? ""} onChange={e => setForm(p => ({ ...p, max_korting_percentage: e.target.value ? parseFloat(e.target.value) : null }))} className="rounded-xl" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Leverancier & Codes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Product code</Label><Input value={form.product_code} onChange={e => setForm(p => ({ ...p, product_code: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Leverancier</Label><Input value={form.leverancier} onChange={e => setForm(p => ({ ...p, leverancier: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Artikelnummer</Label><Input value={form.artikelnummer} onChange={e => setForm(p => ({ ...p, artikelnummer: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>EAN code</Label><Input value={form.ean_code} onChange={e => setForm(p => ({ ...p, ean_code: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Levertijd</Label><Input value={form.levertijd} onChange={e => setForm(p => ({ ...p, levertijd: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Garantie (jaren)</Label><Input type="number" value={form.garantie_jaren ?? ""} onChange={e => setForm(p => ({ ...p, garantie_jaren: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
                <div className="col-span-2"><Label>Certificeringen</Label><Input value={form.certificeringen} onChange={e => setForm(p => ({ ...p, certificeringen: e.target.value }))} className="rounded-xl" /></div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Opslaan..." : editingProduct ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Import Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={(open) => { if (!open) closeAiDialog(); else setAiDialogOpen(true); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Product Import
            </DialogTitle>
          </DialogHeader>

          {aiStep === "input" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Voer een merknaam en categorie in. AI zoekt automatisch het productassortiment op met alle technische specificaties.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Merknaam *</Label>
                  <Input
                    placeholder="bijv. SolarEdge, Enphase, Daikin..."
                    value={aiMerk}
                    onChange={e => setAiMerk(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>Categorie *</Label>
                  <Select value={aiCategorie} onValueChange={v => setAiCategorie(v as ProductCategorie)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categorieLabels) as ProductCategorie[]).map(c => (
                        <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAiDialog} className="rounded-pill">Annuleren</Button>
                <Button onClick={handleAiSearch} disabled={aiLoading} className="rounded-pill gap-2">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? "Zoeken..." : "Producten ophalen"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {aiStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {aiProducts.length} producten gevonden voor <strong>{aiMerk}</strong>. Selecteer welke je wilt importeren.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setAiSelected(new Set(aiProducts.map((_, i) => i)))}>
                    Alles selecteren
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setAiSelected(new Set())}>
                    Niets selecteren
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {aiProducts.map((product, idx) => (
                  <Card key={idx} className={`rounded-xl border cursor-pointer transition-colors ${aiSelected.has(idx) ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => toggleAiSelect(idx)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={aiSelected.has(idx)}
                          onCheckedChange={() => toggleAiSelect(idx)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground">{product.naam}</p>
                            <p className="text-sm font-semibold text-primary whitespace-nowrap">
                              {formatPrice(product.prijs_excl_btw)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{product.model} · {product.merk}</p>
                          {product.omschrijving && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.omschrijving}</p>
                          )}
                          {product.specs && Object.keys(product.specs).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {Object.entries(product.specs).slice(0, 6).map(([key, val]) => (
                                <Badge key={key} variant="outline" className="text-xs font-normal">
                                  {key}: {val}
                                </Badge>
                              ))}
                              {Object.keys(product.specs).length > 6 && (
                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                  +{Object.keys(product.specs).length - 6} meer
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            {product.garantie_jaren && <span>Garantie: {product.garantie_jaren} jaar</span>}
                            {product.certificeringen && <span>{product.certificeringen}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAiStep("input")} className="rounded-pill">Terug</Button>
                <Button onClick={handleAiImport} disabled={aiLoading || aiSelected.size === 0} className="rounded-pill gap-2">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {aiLoading ? "Importeren..." : `${aiSelected.size} producten importeren`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Producten;
