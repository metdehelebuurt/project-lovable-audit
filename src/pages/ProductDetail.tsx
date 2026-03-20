import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, Loader2, Download, Eye, FileText, CheckCircle,
  Package, Pencil, Save, X, Upload, ScanSearch,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductImage from "@/components/producten/ProductImage";
import ProductDatasheet from "@/components/producten/ProductDatasheet";
import { getGroupedSpecs, categorySpecDefinitions } from "@/components/producten/categorySpecDefinitions";
import SpecsEditor from "@/components/producten/SpecsEditor";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

const categorieLabels: Record<string, string> = {
  zonnepanelen: "Zonnepanelen", thuisbatterij: "Thuisbatterij", warmtepomp: "Warmtepomp",
  laadpaal: "Laadpaal", omvormer: "Omvormer", accessoires: "Accessoires",
  installatiemateriaal: "Installatiemateriaal",
};

const statusColors: Record<string, string> = {
  actief: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  uitgefaseerd: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  niet_beschikbaar: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [editedSpecs, setEditedSpecs] = useState<Record<string, string>>({});
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [partnerTekst, setPartnerTekst] = useState("");
  const [editingTekst, setEditingTekst] = useState(false);
  const [savingTekst, setSavingTekst] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

  // Partner-specific offerte tekst
  const { data: partnerTekstData } = useQuery({
    queryKey: ["partner-product-tekst", id, profile?.partner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_product_teksten" as any)
        .select("*")
        .eq("partner_id", profile!.partner_id!)
        .eq("product_id", id!)
        .maybeSingle();
      return data as any;
    },
    enabled: !!id && !!profile?.partner_id,
  });

  const effectiveOfferteTekst = partnerTekstData?.offerte_tekst || product?.offerte_tekst || "";

  const handleSavePartnerTekst = async () => {
    if (!profile?.partner_id || !id) return;
    setSavingTekst(true);
    try {
      const { error } = await supabase.from("partner_product_teksten" as any).upsert({
        partner_id: profile.partner_id,
        product_id: id,
        offerte_tekst: partnerTekst,
        updated_at: new Date().toISOString(),
      }, { onConflict: "partner_id,product_id" });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["partner-product-tekst", id, profile.partner_id] });
      setEditingTekst(false);
      toast.success("Offerte tekst opgeslagen");
    } catch (err: any) {
      toast.error("Opslaan mislukt", { description: err.message });
    } finally {
      setSavingTekst(false);
    }
  };

  const specs: Record<string, string> = product?.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, string>) : {};

  const grouped = product ? getGroupedSpecs(product.categorie) : {};
  const filledSpecs = Object.entries(specs).filter(([, v]) => v && String(v).trim() !== "");
  const totalDefined = product ? (categorySpecDefinitions[product.categorie] || []).length : 0;

  const loadPartner = async () => {
    if (partner) return partner;
    const partnerId = product?.partner_id || profile?.partner_id;
    if (!partnerId) {
      const p = { naam: "mijnhuis.nu", primaire_kleur: "#5B58E1", secundaire_kleur: "#1a1a2e" };
      setPartner(p);
      return p;
    }
    const { data } = await supabase.from("partners")
      .select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan")
      .eq("id", partnerId).single();
    if (data) setPartner(data);
    return data;
  };

  const handleAiVerify = async () => {
    if (!product) return;
    setAiLoading(true);
    try {
      // If a manufacturer PDF is uploaded, use PDF parser instead of web search
      const hasPdf = product.datasheet_type === "fabrikant" && product.datasheet_url;
      
      let corrected: Record<string, string> = {};
      let description = "";

      if (hasPdf) {
        const { data, error } = await supabase.functions.invoke("ai-parse-datasheet", {
          body: { product_id: product.id, categorie: product.categorie },
        });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); return; }
        corrected = data.extracted_specs || {};
        description = `Geëxtraheerd uit geüploade PDF`;
        
        const updateData: any = { specs: { ...specs, ...corrected } };
        if (data.product_merk && !product.merk) updateData.merk = data.product_merk;
        if (data.product_model && !product.model) updateData.model = data.product_model;
        
        const { error: updateErr } = await supabase.from("producten").update(updateData).eq("id", product.id);
        if (updateErr) throw updateErr;
      } else {
        const { data, error } = await supabase.functions.invoke("ai-verify-product-specs", {
          body: {
            naam: product.naam, merk: product.merk, model: product.model,
            categorie: product.categorie, specs, certificeringen: product.certificeringen,
            omschrijving: product.omschrijving, garantie_jaren: product.garantie_jaren,
          },
        });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); return; }
        corrected = data.corrected_specs || {};
        const bronnen = data.bronnen as string[] | undefined;
        description = bronnen?.length ? `Bronnen: ${bronnen.length} webpagina's` : "Gebaseerd op AI trainingsdata";

        const allSpecs: Record<string, string> = { ...specs, ...corrected };
        const updateData: any = { specs: allSpecs };
        if (data.omschrijving_suggestie && !product.omschrijving) updateData.omschrijving = data.omschrijving_suggestie;
        if (data.regelgeving) updateData.certificeringen = data.regelgeving;

        const { error: updateErr } = await supabase.from("producten").update(updateData).eq("id", product.id);
        if (updateErr) throw updateErr;
      }

      queryClient.invalidateQueries({ queryKey: ["product", id] });

      const newCount = Object.keys(corrected).length;
      toast.success(`${newCount} specificaties gevonden & ingevuld`, {
        description,
        duration: 6000,
      });
    } catch (err: any) {
      toast.error("AI verificatie mislukt", { description: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handlePreview = async () => {
    const p = await loadPartner();
    if (p) setPreviewOpen(true);
  };

  const handleSaveSpecs = async () => {
    if (!product) return;
    setSavingSpecs(true);
    try {
      const cleaned: Record<string, string> = {};
      Object.entries(editedSpecs).forEach(([k, v]) => {
        if (k.trim()) cleaned[k.trim()] = v;
      });
      const { error } = await supabase.from("producten").update({ specs: cleaned }).eq("id", product.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      setEditingSpecs(false);
      toast.success("Specificaties opgeslagen");
    } catch (err: any) {
      toast.error("Opslaan mislukt", { description: err.message });
    } finally {
      setSavingSpecs(false);
    }
  };

  // Build datasheet URL — handle both relative paths and full URLs
  const buildDatasheetUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${url}`;
  };

  const datasheetPublicUrl = product?.datasheet_url && product?.datasheet_type === "fabrikant"
    ? buildDatasheetUrl(product.datasheet_url)
    : null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    if (file.type !== "application/pdf") { toast.error("Alleen PDF-bestanden zijn toegestaan"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Maximaal 10MB"); return; }
    
    // Create local blob URL for instant preview
    const blobUrl = URL.createObjectURL(file);
    setLocalPdfUrl(blobUrl);
    
    setUploading(true);
    try {
      const path = `datasheets/${product.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) throw uploadError;
      const { error: updateErr } = await supabase.from("producten")
        .update({ datasheet_url: path, datasheet_type: "fabrikant" })
        .eq("id", product.id);
      if (updateErr) throw updateErr;
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Datasheet geüpload");
    } catch (err: any) {
      toast.error("Upload mislukt", { description: err.message });
      setLocalPdfUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExtractFromPdf = async () => {
    if (!product) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-parse-datasheet", {
        body: { product_id: product.id, categorie: product.categorie },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const extracted = data.extracted_specs || {};
      const mergedSpecs = { ...specs, ...extracted };

      const updateData: any = { specs: mergedSpecs };
      if (data.product_merk && !product.merk) updateData.merk = data.product_merk;
      if (data.product_model && !product.model) updateData.model = data.product_model;

      const { error: updateErr } = await supabase.from("producten").update(updateData).eq("id", product.id);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ["product", id] });
      const count = Object.keys(extracted).length;
      toast.success(`${count} specificaties geëxtraheerd uit PDF`, {
        description: data.notes?.length ? data.notes.join("; ") : undefined,
      });
    } catch (err: any) {
      toast.error("Extractie mislukt", { description: err.message });
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerateDatasheet = async () => {
    if (!product) return;
    // First run AI verify to fill specs, then mark as generated
    await handleAiVerify();
    const { error } = await supabase.from("producten")
      .update({ datasheet_type: "gegenereerd" })
      .eq("id", product.id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      const p = await loadPartner();
      if (p) setPreviewOpen(true);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!product) return <div className="p-8 text-center text-muted-foreground">Product niet gevonden</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/producten")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-foreground truncate">{product.naam}</h1>
          <div className="flex items-center gap-2 mt-1">
            {product.merk && <span className="text-muted-foreground text-sm">{product.merk}</span>}
            {product.model && <span className="text-muted-foreground text-sm">• {product.model}</span>}
          </div>
        </div>
        <Badge className={statusColors[product.status] || ""}>{product.status.replace(/_/g, " ")}</Badge>
        <Badge variant="outline">{categorieLabels[product.categorie] || product.categorie}</Badge>
      </div>

      <Tabs defaultValue="overzicht">
        <TabsList className="rounded-xl">
          <TabsTrigger value="overzicht" className="rounded-lg">Overzicht</TabsTrigger>
          <TabsTrigger value="specificaties" className="rounded-lg">Specificaties ({filledSpecs.length}/{totalDefined})</TabsTrigger>
          <TabsTrigger value="datasheet" className="rounded-lg">Datasheet</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg">AI Controle</TabsTrigger>
        </TabsList>

        {/* ── OVERZICHT ── */}
        <TabsContent value="overzicht">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="pt-6 flex items-center justify-center">
                <div className="w-48 h-48">
                  <ProductImage
                    afbeeldingUrl={product.afbeelding_url}
                    naam={product.naam}
                    merk={product.merk}
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Prijs excl. BTW</p>
                      <p className="text-lg font-bold text-foreground">{formatPrice(Number(product.prijs_excl_btw))}</p>
                    </div>
                    {product.kostprijs && (
                      <div>
                        <p className="text-xs text-muted-foreground">Kostprijs</p>
                        <p className="text-lg font-semibold text-foreground">{formatPrice(Number(product.kostprijs))}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">BTW</p>
                      <p className="text-sm font-medium text-foreground">{product.btw_percentage ?? 21}%</p>
                    </div>
                    {product.garantie_jaren && (
                      <div>
                        <p className="text-xs text-muted-foreground">Garantie</p>
                        <p className="text-sm font-medium text-foreground">{product.garantie_jaren} jaar</p>
                      </div>
                    )}
                    {product.leverancier && (
                      <div>
                        <p className="text-xs text-muted-foreground">Leverancier</p>
                        <p className="text-sm font-medium text-foreground">{product.leverancier}</p>
                      </div>
                    )}
                    {product.voorraad !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Voorraad</p>
                        <p className="text-sm font-medium text-foreground">{product.voorraad} {product.eenheid || "stuks"}</p>
                      </div>
                    )}
                  </div>
                  {product.omschrijving && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-1">Omschrijving</p>
                      <p className="text-sm text-foreground leading-relaxed">{product.omschrijving}</p>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Offerte tekst (partner-specifiek)</p>
                      {!editingTekst ? (
                        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => { setPartnerTekst(effectiveOfferteTekst); setEditingTekst(true); }}>
                          <Pencil className="h-3 w-3" /> Bewerken
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingTekst(false)}><X className="h-3 w-3" /></Button>
                          <Button size="sm" className="h-6 gap-1 text-xs" disabled={savingTekst} onClick={handleSavePartnerTekst}>
                            <Save className="h-3 w-3" /> Opslaan
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingTekst ? (
                      <Textarea value={partnerTekst} onChange={e => setPartnerTekst(e.target.value)} rows={3} className="rounded-xl text-sm" placeholder="Tekst die op de offerte verschijnt bij dit product..." />
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed">{effectiveOfferteTekst || <span className="text-muted-foreground italic">Geen offerte tekst ingesteld</span>}</p>
                    )}
                  </div>
                  {product.certificeringen && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-1">Certificeringen</p>
                      <p className="text-sm text-foreground">{product.certificeringen}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {(product.product_code || product.artikelnummer || product.ean_code) && (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {product.product_code && <div><span className="text-muted-foreground">Code: </span><span className="font-medium">{product.product_code}</span></div>}
                      {product.artikelnummer && <div><span className="text-muted-foreground">Art.nr: </span><span className="font-medium">{product.artikelnummer}</span></div>}
                      {product.ean_code && <div><span className="text-muted-foreground">EAN: </span><span className="font-medium">{product.ean_code}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── SPECIFICATIES ── */}
        <TabsContent value="specificaties">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Technische Specificaties</CardTitle>
                <div className="flex items-center gap-2">
                  {editingSpecs ? (
                    <>
                      <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg" onClick={() => setEditingSpecs(false)}>
                        <X className="h-4 w-4" /> Annuleren
                      </Button>
                      <Button size="sm" className="gap-1.5 rounded-lg" disabled={savingSpecs} onClick={handleSaveSpecs}>
                        {savingSpecs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Opslaan
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline" size="sm" className="gap-1.5 rounded-lg"
                        onClick={() => { setEditedSpecs({ ...specs }); setEditingSpecs(true); }}
                      >
                        <Pencil className="h-4 w-4" /> Bewerken
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={handleAiVerify} disabled={aiLoading}>
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        AI invullen
                      </Button>
                      <Button size="sm" className="gap-1.5 rounded-lg" onClick={handlePreview}>
                        <Download className="h-4 w-4" /> Specificatieblad
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {!editingSpecs && (
                <Badge variant="outline" className="w-fit mt-1">{filledSpecs.length} van {totalDefined} ingevuld</Badge>
              )}
            </CardHeader>
            <CardContent>
              {editingSpecs ? (
                <SpecsEditor specs={editedSpecs} onChange={setEditedSpecs} categorie={product.categorie} />
              ) : Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Geen specificatie-definitie beschikbaar voor deze categorie.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([group, defs]) => {
                    const filledInGroup = defs.filter(d => specs[d.key] && String(specs[d.key]).trim() !== "");
                    return (
                      <div key={group}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-1 h-5 rounded ${filledInGroup.length > 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                          <h3 className="text-sm font-semibold text-foreground">{group}</h3>
                          <span className="text-xs text-muted-foreground">({filledInGroup.length}/{defs.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                          {defs.map(def => {
                            const val = specs[def.key];
                            const filled = val && String(val).trim() !== "";
                            return (
                              <div key={def.key} className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-sm text-muted-foreground">{def.label}</span>
                                <span className={`text-sm ${filled ? "font-medium text-foreground" : "text-muted-foreground/50 italic"}`}>
                                  {filled ? `${val}${def.unit ? ` ${def.unit}` : ""}` : "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {/* Custom specs */}
                  {(() => {
                    const definedKeys = new Set((categorySpecDefinitions[product.categorie] || []).map(d => d.key));
                    const custom = Object.entries(specs).filter(([k, v]) => !definedKeys.has(k) && v && String(v).trim() !== "");
                    if (custom.length === 0) return null;
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 rounded bg-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground">Overige</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          {custom.map(([key, val]) => (
                            <div key={key} className="flex justify-between py-1.5 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">{key.replace(/_/g, " ")}</span>
                              <span className="text-sm font-medium text-foreground">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datasheet">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Datasheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload section — always visible */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Fabrikant datasheet uploaden</p>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    PDF uploaden
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg"
                    onClick={handleGenerateDatasheet}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Datasheet genereren
                  </Button>
                </div>
              </div>

              {/* Current datasheet display */}
              {(datasheetPublicUrl || localPdfUrl) ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Fabrikant datasheet beschikbaar</p>
                      <p className="text-xs text-muted-foreground">PDF van de fabrikant</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 rounded-lg"
                        onClick={handleExtractFromPdf}
                        disabled={extracting}
                      >
                        {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                        Specs uit PDF halen
                      </Button>
                      {datasheetPublicUrl && (
                        <a href={datasheetPublicUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="gap-2 rounded-lg">
                            <Download className="h-4 w-4" /> Download PDF
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                  <iframe src={localPdfUrl || datasheetPublicUrl!} className="w-full h-[600px] rounded-xl border" />
                </div>
              ) : product.datasheet_type === "gegenereerd" ? (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Gegenereerd specificatieblad</p>
                    <p className="text-xs text-muted-foreground">Automatisch gegenereerd op basis van productgegevens</p>
                  </div>
                  <Button size="sm" className="gap-2 rounded-lg" onClick={handlePreview}>
                    <Eye className="h-4 w-4" /> Bekijk & Print
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nog geen datasheet — upload een PDF of laat AI er een genereren.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI CONTROLE ── */}
        <TabsContent value="ai">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Specificatie Controle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Laat AI de productspecificaties controleren, corrigeren en ontbrekende waarden aanvullen
                op basis van het merk, model en categorie.
              </p>
              <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Huidig ingevuld:</span>
                  <Badge variant="outline">{filledSpecs.length} / {totalDefined} specificaties</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Categorie:</span>
                  <span className="font-medium">{categorieLabels[product.categorie] || product.categorie}</span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full gap-3 rounded-xl h-14 text-base font-semibold"
                onClick={handleAiVerify}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> AI controleert specificaties...</>
                ) : (
                  <><Sparkles className="h-5 w-5" /> Specificaties controleren &amp; aanvullen</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                De AI zoekt technische data op basis van productnaam, merk en model en vult ontbrekende specificaties aan.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[240mm] max-h-[95vh] overflow-y-auto p-0">
          <div className="no-print sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
            <DialogHeader><DialogTitle>Specificatieblad Preview</DialogTitle></DialogHeader>
            <Button size="sm" className="rounded-lg gap-2" onClick={() => window.print()}>
              <Download className="h-4 w-4" /> PDF downloaden
            </Button>
          </div>
          {partner && (
            <ProductDatasheet
              product={{
                naam: product.naam, merk: product.merk, model: product.model,
                categorie: product.categorie, omschrijving: product.omschrijving,
                afbeelding_url: product.afbeelding_url, specs,
                certificeringen: product.certificeringen, garantie_jaren: product.garantie_jaren,
                prijs_excl_btw: Number(product.prijs_excl_btw),
                onderhoud: product.onderhoud, installatie_instructies: product.installatie_instructies,
              }}
              partner={partner}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;
