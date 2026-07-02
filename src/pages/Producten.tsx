import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package, Sparkles, Copy, Tag } from "lucide-react";
import ImportExportButtons from "@/components/shared/ImportExportButtons";
import type { Database } from "@/integrations/supabase/types";
import ProductImage from "@/components/producten/ProductImage";
import BulkWebsiteToggle from "@/components/producten/website/BulkWebsiteToggle";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Globe } from "lucide-react";
import ProductInlineForm, { type ProductFormData } from "@/components/producten/ProductInlineForm";
import AiImportDialog, { type AIProduct } from "@/components/producten/AiImportDialog";

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

const emptyForm: ProductFormData = {
  naam: "", categorie: "zonnepanelen", merk: "", model: "",
  omschrijving: "", offerte_tekst: "", prijs_excl_btw: 0, kostprijs: null, eenheid: "stuk",
  voorraad: null, min_voorraad: null, btw_percentage: 21, max_korting_euro: null,
  max_korting_percentage: null, product_code: "", leverancier: "",
  artikelnummer: "", ean_code: "", levertijd: "", garantie_jaren: null,
  certificeringen: "", status: "actief", afbeelding_url: null,
  afbeeldingen: [], specs: {},
  datasheet_url: null, datasheet_type: null,
  heeft_serienummer: false, is_assemblage: false,
  prijs_strategie: "vast", marge_opslag_percentage: 0,
};

function isSimilar(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_\/\\().]+/g, "").trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (shorter.length < 3) return false;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / shorter.length > 0.85 && Math.abs(na.length - nb.length) < 5;
}

function isDuplicate(product: AIProduct, existingNames: string[]): boolean {
  return existingNames.some(existing => {
    const existingNorm = existing.replace(/\s*\(.*\)\s*$/, "");
    return isSimilar(product.naam, existingNorm) || isSimilar(product.naam, existing);
  });
}

const Producten = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { hasFeature } = useSubscriptionLimits();
  const hasWebshopModule = hasFeature("webshop_module");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("alle");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
  const [aiExistingNames, setAiExistingNames] = useState<string[]>([]);

  const isSuperadmin = profile?.rol === "superadmin";
  const isPartnerAdmin = profile?.rol === "partner_admin";
  const isPartnerStaff = profile?.rol === "partner_staff";
  const isInstallateur = profile?.rol === "installateur";
  const canEdit = isSuperadmin || isPartnerAdmin || isPartnerStaff || isInstallateur;

  const showInlineForm = isCreating || editingProduct !== null;

  // Fetch partner feature flags for product visibility
  const { data: partnerFlags } = useQuery({
    queryKey: ["partner-flags", profile?.partner_id],
    enabled: !!profile?.partner_id && !isSuperadmin,
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("feature_flags_json").eq("id", profile!.partner_id!).single();
      return (data?.feature_flags_json && typeof data.feature_flags_json === "object") ? data.feature_flags_json as Record<string, any> : {};
    },
  });
  const alleenEigenProducten = !isSuperadmin && partnerFlags?.alleen_eigen_producten === true;

  const { data: producten = [], isLoading } = useQuery({
    queryKey: ["producten", alleenEigenProducten],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").order("naam");
      if (error) throw error;
      let result = data as Product[];
      if (alleenEigenProducten && profile?.partner_id) {
        result = result.filter(p => p.partner_id === profile.partner_id);
      }
      return result;
    },
  });

  const { data: partnerMerken = [] } = useQuery({
    queryKey: ["partner-merken-namen", profile?.partner_id],
    enabled: !!profile?.partner_id,
    queryFn: async () => {
      const { data, error } = await (supabase.from("partner_merken" as never) as any)
        .select("merk")
        .eq("partner_id", profile!.partner_id!)
        .order("merk", { ascending: true });
      if (error) return [];
      return Array.from(new Set(((data ?? []) as { merk: string }[]).map(r => r.merk).filter(Boolean)));
    },
  });

  const merkSuggesties = Array.from(new Set([
    ...partnerMerken,
    ...producten.map(p => p.merk).filter((m): m is string => !!m && m.trim() !== ""),
  ])).sort((a, b) => a.localeCompare(b));

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
      const { id, afbeelding_url, afbeeldingen, specs, datasheet_url, datasheet_type, offerte_tekst, ...rest } = data;
      const record: any = {
        ...rest,
        offerte_tekst: offerte_tekst || null,
        afbeelding_url: afbeelding_url || null,
        afbeeldingen: afbeeldingen.length > 0 ? afbeeldingen : null,
        specs: Object.keys(specs).length > 0 ? specs : null,
        datasheet_url: datasheet_url || null,
        datasheet_type: datasheet_type || null,
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
      closeForm();
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

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsCreating(true);
  };

  const openEdit = (p: Product) => {
    setIsCreating(false);
    setEditingProduct(p);
    const galleryImages = Array.isArray(p.afbeeldingen) ? (p.afbeeldingen as string[]) : [];
    const specs = (p.specs && typeof p.specs === "object" && !Array.isArray(p.specs))
      ? (p.specs as Record<string, string>)
      : {};
    setForm({
      naam: p.naam, categorie: p.categorie, merk: p.merk || "",
      model: p.model || "", omschrijving: p.omschrijving || "",
      offerte_tekst: (p as any).offerte_tekst || "",
      prijs_excl_btw: Number(p.prijs_excl_btw), kostprijs: p.kostprijs ? Number(p.kostprijs) : null,
      eenheid: p.eenheid || "stuk", voorraad: p.voorraad,
      min_voorraad: (p as any).min_voorraad ?? null,
      btw_percentage: p.btw_percentage ?? 21,
      max_korting_euro: p.max_korting_euro ? Number(p.max_korting_euro) : null,
      max_korting_percentage: p.max_korting_percentage ? Number(p.max_korting_percentage) : null,
      product_code: p.product_code || "", leverancier: p.leverancier || "",
      artikelnummer: p.artikelnummer || "", ean_code: p.ean_code || "",
      levertijd: p.levertijd || "", garantie_jaren: p.garantie_jaren,
      certificeringen: p.certificeringen || "", status: p.status,
      afbeelding_url: p.afbeelding_url || null,
      afbeeldingen: galleryImages,
      specs,
      datasheet_url: (p as any).datasheet_url || null,
      datasheet_type: (p as any).datasheet_type || null,
      heeft_serienummer: (p as any).heeft_serienummer ?? false,
      is_assemblage: (p as any).is_assemblage ?? false,
      prijs_strategie: ((p as any).prijs_strategie as "vast" | "som_componenten") || "vast",
      marge_opslag_percentage: Number((p as any).marge_opslag_percentage ?? 0),
    });
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

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
      if (data?.error) { toast.error(data.error); return; }
      const products: AIProduct[] = data?.products || [];
      const existingNames: string[] = data?.bestaande_producten || [];
      setAiExistingNames(existingNames);
      if (products.length === 0) { toast.info("Geen producten gevonden voor dit merk en deze categorie"); return; }
      setAiProducts(products);
      const preSelected = new Set<number>();
      products.forEach((p, i) => {
        if (!isDuplicate(p, existingNames) && !(p.warnings && p.warnings.length > 0)) preSelected.add(i);
      });
      setAiSelected(preSelected);
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
        naam: p.naam, model: p.model || null, merk: p.merk || null,
        omschrijving: p.omschrijving || null, prijs_excl_btw: p.prijs_excl_btw || 0,
        garantie_jaren: p.garantie_jaren || null, certificeringen: p.certificeringen || null,
        specs: p.specs ? (p.specs as any) : null, categorie: p.categorie,
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
    setAiDialogOpen(false); setAiMerk(""); setAiCategorie("zonnepanelen");
    setAiProducts([]); setAiSelected(new Set()); setAiStep("input"); setAiExistingNames([]);
  };

  const toggleAiSelect = (idx: number) => {
    setAiSelected(prev => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
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
        {canEdit && !showInlineForm && (
          <div className="flex gap-2">
            <ImportExportButtons
              entityType="producten"
              exportData={producten}
              exportColumns={[
                { key: "naam", label: "Naam" }, { key: "categorie", label: "Categorie" },
                { key: "merk", label: "Merk" }, { key: "model", label: "Model" },
                { key: "prijs_excl_btw", label: "Prijs excl BTW" }, { key: "leverancier", label: "Leverancier" },
                { key: "voorraad", label: "Voorraad" }, { key: "status", label: "Status" },
                { key: "artikelnummer", label: "Artikelnummer" }, { key: "ean_code", label: "EAN" },
              ]}
              exportFilename="producten-export"
              queryKey={["producten"]}
            />
            <Button variant="outline" onClick={() => setAiDialogOpen(true)} className="rounded-pill gap-2">
              <Sparkles className="h-4 w-4" /> AI Import
            </Button>
            <Button variant="outline" onClick={() => navigate("/producten/merken")} className="rounded-pill gap-2">
              <Tag className="h-4 w-4" /> Merken
            </Button>
            <Button onClick={openCreate} className="rounded-pill gap-2">
              <Plus className="h-4 w-4" /> Nieuw Product
            </Button>
          </div>
        )}
      </div>

      {/* Inline Form */}
      {showInlineForm && (
        <ProductInlineForm
          form={form}
          setForm={(updater) => setForm(updater)}
          editingProduct={editingProduct}
          isPending={saveMutation.isPending}
          onClose={closeForm}
          onSubmit={handleSubmit}
          categorieLabels={categorieLabels}
          statusLabels={statusLabels}
          merken={merkSuggesties}
        />
      )}

      {/* Stats */}
      {!showInlineForm && (
        <>
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
        </>
      )}

      {/* Product table */}
      {canEdit && (
        <BulkWebsiteToggle
          producten={producten}
          partnerId={profile?.partner_id}
          hasWebshopModule={hasWebshopModule}
          categorieLabels={categorieLabels}
        />
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
                    <TableHead className="w-12"></TableHead>
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
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/producten/${product.id}`)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <ProductImage
                          afbeeldingUrl={product.afbeelding_url}
                          merk={product.merk}
                          naam={product.naam}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium flex items-center gap-1.5">
                            <span>{product.naam}</span>
                            {(product as any).is_assemblage && (
                              <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                                title="Samengesteld product"
                              >
                                BUNDEL
                              </span>
                            )}
                          </p>
                          {product.product_code && <p className="text-xs text-muted-foreground">{product.product_code}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{categorieLabels[product.categorie]}</TableCell>
                      <TableCell>{product.merk || "—"}</TableCell>
                      <TableCell>{formatPrice(Number(product.prijs_excl_btw))}</TableCell>
                      <TableCell>{product.voorraad ?? "—"}</TableCell>
                      <TableCell><Badge className={statusColors[product.status]}>{statusLabels[product.status]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{product.partner_id ? "Partner" : "Globaal"}</Badge>
                          {(product as any).toon_op_website && (
                            <span title="Zichtbaar op website" className="inline-flex items-center text-primary">
                              <Globe className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {/* Only allow editing own products or superadmin */}
                            {(isSuperadmin || product.partner_id === profile?.partner_id) ? (
                              <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" title="Dupliceer naar eigen catalogus" onClick={() => {
                                setIsCreating(true);
                                setEditingProduct(null);
                                const galleryImages = Array.isArray(product.afbeeldingen) ? (product.afbeeldingen as string[]) : [];
                                const specs = (product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)) ? (product.specs as Record<string, string>) : {};
                                setForm({
                                  naam: product.naam, categorie: product.categorie, merk: product.merk || "",
                                  model: product.model || "", omschrijving: product.omschrijving || "",
                                  offerte_tekst: (product as any).offerte_tekst || "",
                                  prijs_excl_btw: Number(product.prijs_excl_btw), kostprijs: product.kostprijs ? Number(product.kostprijs) : null,
                                  eenheid: product.eenheid || "stuk", voorraad: product.voorraad,
                                  min_voorraad: (product as any).min_voorraad ?? null,
                                  btw_percentage: product.btw_percentage ?? 21,
                                  max_korting_euro: product.max_korting_euro ? Number(product.max_korting_euro) : null,
                                  max_korting_percentage: product.max_korting_percentage ? Number(product.max_korting_percentage) : null,
                                  product_code: product.product_code || "", leverancier: product.leverancier || "",
                                  artikelnummer: product.artikelnummer || "", ean_code: product.ean_code || "",
                                  levertijd: product.levertijd || "", garantie_jaren: product.garantie_jaren,
                                  certificeringen: product.certificeringen || "", status: product.status,
                                  afbeelding_url: product.afbeelding_url || null,
                                  afbeeldingen: galleryImages, specs,
                                  datasheet_url: (product as any).datasheet_url || null,
                                  datasheet_type: (product as any).datasheet_type || null,
                                  heeft_serienummer: (product as any).heeft_serienummer ?? false,
                                  is_assemblage: (product as any).is_assemblage ?? false,
                                  prijs_strategie: ((product as any).prijs_strategie as "vast" | "som_componenten") || "vast",
                                  marge_opslag_percentage: Number((product as any).marge_opslag_percentage ?? 0),
                                });
                                toast.info("Catalogusproduct gedupliceerd — sla op om uw eigen versie te maken");
                              }}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
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

      {/* AI Import Dialog (kept as dialog — it's a wizard flow) */}
      <AiImportDialog
        open={aiDialogOpen}
        onClose={closeAiDialog}
        step={aiStep}
        onStepChange={setAiStep}
        merk={aiMerk}
        onMerkChange={setAiMerk}
        categorie={aiCategorie}
        onCategorieChange={setAiCategorie}
        categorieLabels={categorieLabels}
        loading={aiLoading}
        products={aiProducts}
        selected={aiSelected}
        onToggleSelect={toggleAiSelect}
        onSelectAll={() => setAiSelected(new Set(aiProducts.map((_, i) => i)))}
        onSelectNone={() => setAiSelected(new Set())}
        onSelectNew={() => {
          const all = new Set<number>();
          aiProducts.forEach((p, i) => { if (!isDuplicate(p, aiExistingNames)) all.add(i); });
          setAiSelected(all);
        }}
        existingNames={aiExistingNames}
        isDuplicate={isDuplicate}
        onSearch={handleAiSearch}
        onImport={handleAiImport}
        formatPrice={formatPrice}
      />
    </div>
  );
};

export default Producten;
