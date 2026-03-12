import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Trash2, Upload, Image } from "lucide-react";

export interface SchouwFoto {
  url: string;
  label: string;
  uploaded_at: string;
}

interface SchouwMediaUploadProps {
  schouwId: string;
  fotos: SchouwFoto[];
  onFotosChange: (fotos: SchouwFoto[]) => void;
  disabled?: boolean;
}

const SchouwMediaUpload = ({ schouwId, fotos, onFotosChange, disabled }: SchouwMediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newFotos: SchouwFoto[] = [...fotos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name}: alleen afbeeldingen en video's toegestaan`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: maximaal 10MB`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${schouwId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("schouw-media").upload(path, file);
      if (error) {
        toast.error(`Upload mislukt: ${error.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("schouw-media").getPublicUrl(path);
      newFotos.push({
        url: publicUrl,
        label: label || file.name,
        uploaded_at: new Date().toISOString(),
      });
    }

    onFotosChange(newFotos);
    setLabel("");
    setUploading(false);
    toast.success("Bestanden geüpload");
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const updated = fotos.filter((_, i) => i !== index);
    onFotosChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label>Label (optioneel)</Label>
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="bijv. Meterkast, Dakconstructie"
            className="rounded-xl"
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="sr-only">Bestanden kiezen</Label>
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              disabled={uploading || disabled}
              className="hidden"
            />
            <Button type="button" variant="outline" className="rounded-pill gap-2" disabled={uploading || disabled} asChild>
              <span>
                {uploading ? (
                  <><Upload className="h-4 w-4 animate-pulse" /> Uploaden...</>
                ) : (
                  <><Camera className="h-4 w-4" /> Foto's toevoegen</>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((foto, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border bg-muted">
              {foto.url.match(/\.(mp4|mov|webm)$/i) ? (
                <video src={foto.url} className="w-full h-32 object-cover" />
              ) : (
                <img src={foto.url} alt={foto.label} className="w-full h-32 object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                <p className="text-xs text-white truncate">{foto.label}</p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {fotos.length === 0 && (
        <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
          <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nog geen foto's toegevoegd</p>
          <p className="text-xs mt-1">Upload foto's van de situatie ter plaatse</p>
        </div>
      )}
    </div>
  );
};

export default SchouwMediaUpload;
