import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, Loader2, Download, Eye, FileText, CheckCircle,
  Package, ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductImage from "@/components/producten/ProductImage";
import ProductDatasheet from "@/components/producten/ProductDatasheet";
import { getGroupedSpecs, categorySpecDefinitions, type SpecDefinition } from "@/components/producten/categorySpecDefinitions";
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

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

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
      const { data, error } = await supabase.functions.invoke("ai-verify-product-specs", {
        body: {
          naam: product.naam, merk: product.merk, model: product.model,
          categorie: product.categorie, specs, certificeringen: product.certificeringen,
          omschrijving: product.omschrijving, garantie_jaren: product.garantie_jaren,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const allSpecs: Record<string, string> = { ...data.corrected_specs };
      if (data.installatie_specs) {
        Object.entries(data.installatie_specs).forEach(([k, v]) => { allSpecs[k] = v as string; });
      }

      const updateData: any = { specs: allSpecs };
      if (data.omschrijving_suggestie) updateData.omschrijving = data.omschrijving_suggestie;
      if (data.regelgeving) updateData.certificeringen = data.regelgeving;

      const { error: updateErr } = await supabase.from("producten").update(updateData).eq("id", product.id);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Specificaties aangevuld door AI", {
        description: `${Object.keys(allSpecs).length} specificaties bijgewerkt`,
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

  const datasheetPublicUrl = product?.datasheet_url && product?.datasheet_type === "fabrikant"
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.datasheet_url}`
    : null;

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
                    url={product.afbeelding_url}
                    alt={product.naam}
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
                  {product.offerte_tekst && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-1">Offerte tekst</p>
                      <p className="text-sm text-foreground leading-relaxed">{product.offerte_tekst}</p>
                    </div>
                  )}
                  {product.certificeringen && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-1">Certificeringen</p>
                      <p className="text-sm text-foreground">{product.certificeringen}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Product codes */}
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Technische Specificaties</CardTitle>
                <Badge variant="outline">{filledSpecs.length} van {totalDefined} ingevuld</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Geen specificatie-definitie beschikbaar voor deze categorie.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([group, defs]) => {
                    const filledInGroup = defs.filter(d => specs[d.key] && String(specs[d.key]).trim() !== "");
                    if (filledInGroup.length === 0) return null;
                    return (
                      <div key={group}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 rounded bg-primary" />
                          <h3 className="text-sm font-semibold text-foreground">{group}</h3>
                          <span className="text-xs text-muted-foreground">({filledInGroup.length}/{defs.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          {filledInGroup.map(def => (
                            <div key={def.key} className="flex justify-between py-1.5 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">{def.label}</span>
                              <span className="text-sm font-medium text-foreground">
                                {specs[def.key]}{def.unit ? ` ${def.unit}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Custom specs (not in definitions) */}
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

        {/* ── DATASHEET ── */}
        <TabsContent value="datasheet">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Datasheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {datasheetPublicUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Fabrikant datasheet beschikbaar</p>
                      <p className="text-xs text-muted-foreground">PDF van de fabrikant</p>
                    </div>
                    <a href={datasheetPublicUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2 rounded-pill">
                        <Download className="h-4 w-4" /> Download PDF
                      </Button>
                    </a>
                  </div>
                  <iframe src={datasheetPublicUrl} className="w-full h-[600px] rounded-xl border" />
                </div>
              ) : product.datasheet_type === "gegenereerd" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Gegenereerd specificatieblad</p>
                      <p className="text-xs text-muted-foreground">Automatisch gegenereerd op basis van productgegevens</p>
                    </div>
                    <Button size="sm" className="gap-2 rounded-pill" onClick={handlePreview}>
                      <Eye className="h-4 w-4" /> Bekijk & Print
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Geen datasheet beschikbaar</p>
                  <p className="text-xs text-muted-foreground">Gebruik de AI Controle tab om specificaties aan te vullen en een datasheet te genereren.</p>
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
            <Button size="sm" className="rounded-pill gap-2" onClick={() => window.print()}>
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
