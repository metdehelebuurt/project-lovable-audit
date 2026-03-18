import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Sparkles, SkipForward, Check, Loader2, FileText } from "lucide-react";

interface ProductMissingDatasheet {
  id: string;
  naam: string;
  merk: string | null;
  model: string | null;
}

interface DatasheetCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductMissingDatasheet[];
  onComplete: () => void;
  onNavigateToProduct: (productId: string) => void;
}

type ProductStatus = "pending" | "uploading" | "uploaded" | "skipped";

const DatasheetCheckDialog = ({
  open,
  onOpenChange,
  products,
  onComplete,
  onNavigateToProduct,
}: DatasheetCheckDialogProps) => {
  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>(() =>
    Object.fromEntries(products.map((p) => [p.id, "pending" as ProductStatus]))
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const allResolved = products.every(
    (p) => statuses[p.id] === "uploaded" || statuses[p.id] === "skipped"
  );

  const handleUpload = async (productId: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Alleen PDF-bestanden zijn toegestaan");
      return;
    }
    setStatuses((s) => ({ ...s, [productId]: "uploading" }));
    try {
      const path = `datasheets/${productId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("producten")
        .update({
          datasheet_url: urlData.publicUrl,
          datasheet_type: "fabrikant",
        })
        .eq("id", productId);
      if (updateError) throw updateError;

      setStatuses((s) => ({ ...s, [productId]: "uploaded" }));
      toast.success("Datasheet geüpload");
    } catch (err: any) {
      toast.error("Upload mislukt", { description: err.message });
      setStatuses((s) => ({ ...s, [productId]: "pending" }));
    }
  };

  const handleSkip = (productId: string) => {
    setStatuses((s) => ({ ...s, [productId]: "skipped" }));
  };

  const handleGenerate = (productId: string) => {
    onOpenChange(false);
    onNavigateToProduct(productId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ontbrekende productdatasheets
          </DialogTitle>
          <DialogDescription>
            De volgende producten hebben nog geen specificatie-datasheet. Kies per
            product wat je wilt doen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto py-2">
          {products.map((product) => {
            const status = statuses[product.id];
            const label = [product.naam, product.merk, product.model]
              .filter(Boolean)
              .join(" — ");

            return (
              <div
                key={product.id}
                className="border rounded-xl p-3 space-y-2 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[260px]">
                    {label}
                  </span>
                  {status === "uploaded" && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" /> Geüpload
                    </Badge>
                  )}
                  {status === "skipped" && (
                    <Badge variant="secondary" className="gap-1">
                      <SkipForward className="h-3 w-3" /> Overgeslagen
                    </Badge>
                  )}
                  {status === "uploading" && (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploaden…
                    </Badge>
                  )}
                </div>

                {(status === "pending") && (
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[product.id] = el; }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(product.id, f);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 rounded-lg"
                      onClick={() => fileInputRefs.current[product.id]?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 rounded-lg"
                      onClick={() => handleGenerate(product.id)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Genereren
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 rounded-lg text-muted-foreground"
                      onClick={() => handleSkip(product.id)}
                    >
                      <SkipForward className="h-3.5 w-3.5" /> Overslaan
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Annuleren
          </Button>
          <Button
            disabled={!allResolved}
            onClick={onComplete}
            className="rounded-xl gap-2"
          >
            <Check className="h-4 w-4" />
            Doorgaan met offerte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DatasheetCheckDialog;
