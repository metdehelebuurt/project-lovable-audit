import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Upload } from "lucide-react";
import type { PartnerMerk } from "./types";

interface Props {
  merk: PartnerMerk;
  onUpdate: (patch: Partial<PartnerMerk>) => void;
  onUploadLogo: (file: File) => void;
  onDelete: () => void;
}

export const MerkRow = ({ merk, onUpdate, onUploadLogo, onDelete }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [intro, setIntro] = useState(merk.intro_html ?? "");

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {merk.logo_url ? (
            <img src={merk.logo_url} alt={merk.merk} className="object-contain w-full h-full" />
          ) : (
            <span className="text-xs text-muted-foreground">Logo</span>
          )}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Naam</Label>
            <Input
              value={merk.merk}
              onChange={(e) => onUpdate({ merk: e.target.value })}
              maxLength={80}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Slug</Label>
            <Input
              value={merk.slug}
              onChange={(e) => onUpdate({ slug: e.target.value.toLowerCase() })}
              maxLength={60}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Zichtbaar</Label>
            <Switch
              checked={merk.toon_op_website}
              onCheckedChange={(v) => onUpdate({ toon_op_website: v })}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Intro tekst (HTML toegestaan)</Label>
        <Textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          onBlur={() => intro !== (merk.intro_html ?? "") && onUpdate({ intro_html: intro })}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadLogo(f);
            e.target.value = "";
          }}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Logo uploaden
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-xs">Volgorde</Label>
          <Input
            type="number"
            value={merk.volgorde}
            onChange={(e) => onUpdate({ volgorde: parseInt(e.target.value) || 0 })}
            className="w-20"
          />
        </div>
      </div>
    </Card>
  );
};