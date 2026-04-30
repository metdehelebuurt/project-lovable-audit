import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import ProductImage from "./ProductImage";

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

  const uploadFile = async (file: File, isMain: boolean) => {
    if (!TOEGESTAAN.includes(file.type)) {
      toast.error("Ongeldig bestandstype", {
        description: "Alleen JPG, PNG, WebP, GIF of SVG zijn toegestaan.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Bestand te groot", {
        description: `Maximaal 10 MB. Dit bestand is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return;
    }

    // Sessie + partner ophalen voor pad-prefix conform RLS-conventie.
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

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const bestandsnaam = isMain
      ? `main-${Date.now()}.${ext}`
      : `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${partnerPrefix}/products/${productId}/${bestandsnaam}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = data.publicUrl;

      if (isMain) {
        onMainImageChange(url);
      } else {
        onGalleryChange([...galleryImages, url]);
      }
      toast.success("Afbeelding geüpload");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Onbekende fout";
      const friendly = /row-level security|not authorized|permission/i.test(msg)
        ? "Je hebt geen rechten om productafbeeldingen te uploaden. Neem contact op met je beheerder."
        : /exceeded|too large|payload/i.test(msg)
          ? "Het bestand is te groot voor de server (max 10 MB)."
          : msg;
      toast.error("Upload mislukt", { description: friendly });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, isMain);
    e.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
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
                onChange={(e) => handleFileSelect(e, true)}
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
        <p className="text-sm text-foreground">Extra afbeeldingen</p>
        <div className="flex flex-wrap gap-3">
          {galleryImages.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Gallery ${i + 1}`} className="h-16 w-16 rounded-lg object-cover bg-muted" />
              <button
                type="button"
                onClick={() => removeGalleryImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, false)}
              disabled={uploading}
            />
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          </label>
        </div>
      </div>
    </div>
  );
}
