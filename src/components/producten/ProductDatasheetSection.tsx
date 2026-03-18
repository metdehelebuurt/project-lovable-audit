import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, Eye, Download, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
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

interface VerifyResult {
  verified: boolean;
  suggestions: string[];
  corrected_specs: Record<string, string>;
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
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPartner = async () => {
    if (partner) return partner;
    if (!partnerId) {
      // Use platform branding
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

  const handleVerify = async () => {
    if (!productData.naam) {
      toast.error("Voer eerst een productnaam in");
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
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
      setVerifyResult(data as VerifyResult);
      toast.success("Specs geverifieerd door AI");
    } catch (err: any) {
      toast.error("Verificatie mislukt", { description: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const applyVerifiedSpecs = () => {
    if (!verifyResult) return;
    onSpecsUpdate(verifyResult.corrected_specs);
    if (verifyResult.omschrijving_suggestie && onOmschrijvingUpdate) {
      onOmschrijvingUpdate(verifyResult.omschrijving_suggestie);
    }
    toast.success("AI-geverifieerde specs toegepast");
    setVerifyResult(null);
    onDatasheetChange(null, "gegenereerd");
  };

  const handlePreview = async () => {
    await loadPartner();
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const removeDatasheet = () => {
    onDatasheetChange(null, null);
    setVerifyResult(null);
    toast.success("Datasheet verwijderd");
  };

  const datasheetPublicUrl = datasheetUrl && datasheetType === "fabrikant"
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${datasheetUrl}`
    : null;

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
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-pill gap-2"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {verifying ? "Verifiëren..." : "AI Verificatie"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-pill gap-2"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </div>

          {/* AI Verify Results */}
          {verifyResult && (
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                {verifyResult.verified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium text-sm">
                  {verifyResult.verified ? "Specificaties geverifieerd" : "Verbeteringen gevonden"}
                </span>
              </div>

              {verifyResult.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Suggesties:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {verifyResult.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-1">
                        <span className="text-primary">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Object.keys(verifyResult.corrected_specs).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Voorgestelde specs ({Object.keys(verifyResult.corrected_specs).length}):
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs max-h-40 overflow-y-auto">
                    {Object.entries(verifyResult.corrected_specs).map(([k, v]) => (
                      <div key={k} className="flex gap-1">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" size="sm" className="rounded-pill" onClick={applyVerifiedSpecs}>
                  Toepassen
                </Button>
                <Button type="button" variant="ghost" size="sm" className="rounded-pill" onClick={() => setVerifyResult(null)}>
                  Negeren
                </Button>
              </div>
            </div>
          )}

          {datasheetType === "gegenereerd" && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <FileText className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium flex-1">Gegenereerde datasheet actief</p>
              <Button type="button" variant="ghost" size="icon" onClick={removeDatasheet}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── PREVIEW DIALOG ─── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[240mm] max-h-[95vh] overflow-y-auto p-0">
          <div className="no-print sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle>Datasheet Preview</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-pill gap-2" onClick={handlePrint}>
                <Download className="h-4 w-4" /> PDF downloaden
              </Button>
            </div>
          </div>
          {partner && (
            <ProductDatasheet product={productData} partner={partner} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
