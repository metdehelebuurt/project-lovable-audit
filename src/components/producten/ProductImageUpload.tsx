import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, ImagePlus, Star } from "lucide-react";
import ProductImage from "./ProductImage";
import { vriendelijkeUploadFout } from "@/lib/storageErrors";
import { optimaliseerAfbeelding } from "@/lib/imageOptimizer";

interface ProductImageUploadProps {
  productId: string;
  mainImage: string | null;
  galleryImages: string[];
  merk: string | null;
  naam: string;
  onMainImageChange: (url: string | null) => void;
  onGalleryChange: (urls: string[]) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TOEGESTAAN = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export default function ProductImageUpload({
  productId,
  mainImage,
  galleryImages,
  merk,
  naam,
  onMainImageChange,
  onGalleryChange,
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadOne = async (
    origineel: File,
    doel: "main" | "gallery",
    partnerPrefix: string,
  ): Promise<string | null> => {
    if (!TOEGESTAAN.includes(origineel.type)) {
      toast.error("Ongeldig bestandstype", {
        description: "Alleen JPG, PNG, WebP, GIF of SVG zijn toegestaan.",
      });
      return null;
    }
    if (origineel.size > MAX_BYTES) {
      toast.error("Bestand te groot", {
        description: `Maximaal 10 MB. Dit bestand is ${(origineel.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return null;
    }

    const file = await optimaliseerAfbeelding(origineel, { maxWidth: 1600, maxHeight: 1600, kwaliteit: 0.9 });
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const bestandsnaam =
      doel === "main"
        ? `main-${Date.now()}.${ext}`
        : `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${partnerPrefix}/products/${productId}/${bestandsnaam}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) {
      toast.error("Upload mislukt", { description: vriendelijkeUploadFout(uploadError) });
      return null;
    }
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  const uploadFiles = async (files: File[], doel: "main" | "gallery") => {
    if (files.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Niet ingelogd", { description: "Log opnieuw in en probeer het nogmaals." });
      return;
    }
    const { data: profiel } = await supabase
      .from("users")
      .select("partner_id")
      .eq("id", user.id)
      .maybeSingle();
    const partnerPrefix = profiel?.partner_id ?? "global";

    setUploading(true);
    try {
      const nieuweUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const isMain = doel === "main" && i === 0 && !mainImage;
        const url = await uploadOne(files[i], isMain ? "main" : "gallery", partnerPrefix);
        if (!url) continue;
        if (isMain) {
          onMainImageChange(url);
        } else if (doel === "main" && i === 0) {
          // Hoofdafbeelding bestaat al → vervang
          onMainImageChange(url);
        } else {
          nieuweUrls.push(url);
        }
      }
      if (nieuweUrls.length > 0) {
        onGalleryChange([...galleryImages, ...nieuweUrls]);
      }
      if (files.length > 1) {
        toast.success(`${files.length} afbeeldingen geüpload`);
      } else {
        toast.success("Afbeelding geüpload");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, doel: "main" | "gallery") => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) uploadFiles(files, doel);
    e.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  };

  const promoteToMain = (index: number) => {
    const nieuwe = galleryImages[index];
    const rest = galleryImages.filter((_, i) => i !== index);
    if (mainImage) rest.unshift(mainImage);
    onMainImageChange(nieuwe);
    onGalleryChange(rest);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) uploadFiles(files, "gallery");
  };

  // Plakken vanaf klembord wanneer dit component zichtbaar is
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        uploadFiles(files, "gallery");
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryImages, mainImage]);

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Afbeeldingen</h3>

      {/* Main image */}
      <div className="space-y-2">
        <p className="text-sm text-foreground">Hoofdafbeelding</p>
        <div className="flex items-center gap-4">
          <ProductImage afbeeldingUrl={mainImage} merk={merk} naam={naam} size="lg" />
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "main")}
                disabled={uploading}
              />
              <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2 pointer-events-none" disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Uploaden
              </Button>
            </label>
            {mainImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onMainImageChange(null)}
              >
                <X className="h-4 w-4 mr-1" /> Verwijderen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">Extra afbeeldingen</p>
          <p className="text-xs text-muted-foreground">Sleep, plak (Ctrl+V) of selecteer meerdere</p>
        </div>
        <div
          className={`flex flex-wrap gap-3 p-3 rounded-xl border-2 border-dashed transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-transparent"
          }`}
        >
          {galleryImages.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Gallery ${i + 1}`} className="h-16 w-16 rounded-lg object-cover bg-muted" />
              <button
                type="button"
                onClick={() => promoteToMain(i)}
                title="Maak hoofdafbeelding"
                className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => removeGalleryImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, "gallery")}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
