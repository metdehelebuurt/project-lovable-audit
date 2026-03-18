import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, Eye, Download, Loader2, X, CheckCircle } from "lucide-react";
import ProductDatasheet from "./ProductDatasheet";

interface ProductDatasheetSectionProps {
  productId: string;
  productData: {
    naam: string;
    merk: string;
    model: string;
    categorie: string;
    omschrijving: string;
    specs: Record<string, string>;
    certificeringen: string;
    garantie_jaren: number | null;
    prijs_excl_btw: number;
    afbeelding_url: string | null;
    onderhoud?: string;
    installatie_instructies?: string;
  };
  datasheetUrl: string | null;
  datasheetType: string | null;
  onDatasheetChange: (url: string | null, type: string | null) => void;
  onSpecsUpdate: (specs: Record<string, string>) => void;
  onOmschrijvingUpdate?: (omschrijving: string) => void;
  partnerId: string | null;
}

interface GenerateResult {
  verified: boolean;
  suggestions: string[];
  corrected_specs: Record<string, string>;
  installatie_specs?: Record<string, string>;
  regelgeving?: string;
  omschrijving_suggestie?: string;
}

export default function ProductDatasheetSection({
  productId,
  productData,
  datasheetUrl,
  datasheetType,
  onDatasheetChange,
  onSpecsUpdate,
  onOmschrijvingUpdate,
  partnerId,
}: ProductDatasheetSectionProps) {
  const [mode, setMode] = useState<"fabrikant" | "genereer">(datasheetType === "fabrikant" ? "fabrikant" : "genereer");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [enrichedProduct, setEnrichedProduct] = useState<typeof productData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPartner = async () => {
    if (partner) return partner;
    if (!partnerId) {
      const p = { naam: "mijnhuis.nu", primaire_kleur: "#5B58E1", secundaire_kleur: "#1a1a2e", website: "www.mijnhuis.nu", email: "info@mijnhuis.nu" };
      setPartner(p);
      return p;
    }
    const { data } = await supabase.from("partners").select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan").eq("id", partnerId).single();
    if (data) setPartner(data);
    return data;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Alleen PDF-bestanden zijn toegestaan");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximaal 10MB");
      return;
    }

    setUploading(true);
    try {
      const path = `datasheets/${productId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      onDatasheetChange(path, "fabrikant");
      toast.success("Fabrikant-datasheet geüpload");
    } catch (err: any) {
      toast.error("Upload mislukt", { description: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!productData.naam) {
      toast.error("Voer eerst een productnaam in");
      return;
    }
    setGenerating(true);
    setGenerated(false);
    try {
      const { data, error } = await supabase.functions.invoke("ai-verify-product-specs", {
        body: {
          naam: productData.naam,
          merk: productData.merk,
          model: productData.model,
          categorie: productData.categorie,
          specs: productData.specs,
          certificeringen: productData.certificeringen,
          omschrijving: productData.omschrijving,
          garantie_jaren: productData.garantie_jaren,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const result = data as GenerateResult;

      // Merge all specs together: corrected_specs + installatie_specs (prefixed)
      const allSpecs: Record<string, string> = { ...result.corrected_specs };
      if (result.installatie_specs) {
        Object.entries(result.installatie_specs).forEach(([k, v]) => {
          allSpecs[k] = v;
        });
      }

      // Apply specs to product
      onSpecsUpdate(allSpecs);

      // Apply description if available
      if (result.omschrijving_suggestie && onOmschrijvingUpdate) {
        onOmschrijvingUpdate(result.omschrijving_suggestie);
      }

      // Store enriched product for preview with installatie_specs separated
      const enriched = {
        ...productData,
        specs: result.corrected_specs,
        omschrijving: result.omschrijving_suggestie || productData.omschrijving,
        certificeringen: result.regelgeving || productData.certificeringen,
        installatie_specs: result.installatie_specs,
      };
      setEnrichedProduct(enriched as any);

      // Mark as generated
      onDatasheetChange(null, "gegenereerd");
      setGenerated(true);

      // Auto-open preview
      const p = await loadPartner();
      if (p) {
        setPreviewOpen(true);
      }

      toast.success("Specificatieblad gegenereerd", {
        description: `${Object.keys(allSpecs).length} specificaties aangevuld door AI`,
      });
    } catch (err: any) {
      toast.error("Generatie mislukt", { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    const p = await loadPartner();
    if (p) setPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const removeDatasheet = () => {
    onDatasheetChange(null, null);
    setGenerated(false);
    setEnrichedProduct(null);
    toast.success("Datasheet verwijderd");
  };

  const datasheetPublicUrl = datasheetUrl && datasheetType === "fabrikant"
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${datasheetUrl}`
    : null;

  // Use enriched product data for preview if available, otherwise fall back to current productData
  const previewProduct = enrichedProduct || productData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Datasheet</h3>
        {datasheetType && (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {datasheetType === "fabrikant" ? "Fabrikant" : "Gegenereerd"}
          </Badge>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "fabrikant" ? "default" : "outline"}
          size="sm"
          className="rounded-pill gap-2"
          onClick={() => setMode("fabrikant")}
        >
          <Upload className="h-4 w-4" /> Fabrikant uploaden
        </Button>
        <Button
          type="button"
          variant={mode === "genereer" ? "default" : "outline"}
          size="sm"
          className="rounded-pill gap-2"
          onClick={() => setMode("genereer")}
        >
          <Sparkles className="h-4 w-4" /> Zelf genereren
        </Button>
      </div>

      {/* ─── FABRIKANT MODE ─── */}
      {mode === "fabrikant" && (
        <div className="space-y-3">
          <div>
            <Label>PDF datasheet uploaden</Label>
            <div className="mt-1 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="text-sm file:mr-3 file:rounded-pill file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>

          {datasheetType === "fabrikant" && datasheetPublicUrl && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Fabrikant-datasheet actief</p>
                <a href={datasheetPublicUrl} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">
                  Bekijk PDF
                </a>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={removeDatasheet}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── GENEREER MODE ─── */}
      {mode === "genereer" && (
        <div className="space-y-4">
          {/* Main generate button */}
          <Button
            type="button"
            size="lg"
            className="w-full gap-3 rounded-xl h-14 text-base font-semibold"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Specificaties worden gegenereerd...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Specificatieblad genereren
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            AI analyseert het product en genereert een compleet, professioneel specificatieblad
          </p>

          {/* Generated result */}
          {(generated || datasheetType === "gegenereerd") && (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Specificatieblad gegenereerd</span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-pill gap-2 flex-1"
                  onClick={handlePreview}
                >
                  <Eye className="h-4 w-4" /> Bekijk & Download PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-pill gap-2"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  <Sparkles className="h-4 w-4" /> Opnieuw
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={removeDatasheet}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PREVIEW DIALOG ─── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[240mm] max-h-[95vh] overflow-y-auto p-0">
          <div className="no-print sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle>Specificatieblad Preview</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-pill gap-2" onClick={handlePrint}>
                <Download className="h-4 w-4" /> PDF downloaden
              </Button>
            </div>
          </div>
          {partner && (
            <ProductDatasheet product={previewProduct} partner={partner} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
