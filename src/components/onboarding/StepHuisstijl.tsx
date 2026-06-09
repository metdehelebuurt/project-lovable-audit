import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Palette, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { optimaliseerAfbeelding } from "@/lib/imageOptimizer";
import { toast } from "sonner";
import InfoCallout from "./InfoCallout";
import type { OnboardingPartnerData } from "./useOnboardingState";

interface Props {
  partner: OnboardingPartnerData;
  partnerId: string;
  onSave: (patch: Partial<OnboardingPartnerData>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

const PRESETS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#ea580c", "#0891b2", "#db2777", "#1f2937"];

export const StepHuisstijl = ({ partner, partnerId, onSave, onNext, onPrev }: Props) => {
  const [kleur, setKleur] = useState(partner.hoofdkleur || "#7c3aed");
  const [logo, setLogo] = useState(partner.logo_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const opt = await optimaliseerAfbeelding(f, { maxWidth: 512, maxHeight: 512, kwaliteit: 0.92 });
    const path = `${partnerId}/logo-${Date.now()}.webp`;
    const { error } = await supabase.storage.from("partner-assets").upload(path, opt, { upsert: true });
    if (error) { toast.error("Upload mislukt", { description: error.message }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
    setLogo(publicUrl);
    setUploading(false);
  };

  const next = async () => {
    setSaving(true);
    await onSave({ hoofdkleur: kleur, logo_url: logo });
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Huisstijl</h2>
        <p className="text-sm text-muted-foreground mt-1">Je merkkleur en logo verschijnen op offertes, e-mails en het klantportaal.</p>
      </div>

      <InfoCallout title="Waarom dit belangrijk is">
        Een consistente huisstijl maakt je communicatie professioneler en vergroot het vertrouwen van je klanten.
      </InfoCallout>

      <div>
        <Label>Primaire kleur</Label>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="color"
            value={kleur}
            onChange={(e) => setKleur(e.target.value)}
            className="h-12 w-16 rounded-xl border cursor-pointer"
          />
          <Input value={kleur} onChange={(e) => setKleur(e.target.value)} className="rounded-xl w-32 font-mono uppercase" />
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setKleur(p)}
                className="h-8 w-8 rounded-full border-2 border-background ring-1 ring-border hover:scale-110 transition"
                style={{ backgroundColor: p }}
                aria-label={p}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4 mt-2">
          <div className="h-20 w-20 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden">
            {logo ? <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" /> : <Palette className="h-6 w-6 text-muted-foreground" />}
          </div>
          <Label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-pill border bg-card hover:bg-muted text-sm">
              <Upload className="h-4 w-4" /> {uploading ? "Uploaden…" : logo ? "Wijzig logo" : "Logo uploaden"}
            </span>
          </Label>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ backgroundColor: kleur + "10" }}>
        <p className="text-xs text-muted-foreground mb-2">Voorbeeld</p>
        <div className="flex items-center gap-3">
          {logo && <img src={logo} alt="" className="h-8" />}
          <span className="font-semibold" style={{ color: kleur }}>{partner.bedrijfsnaam || "Jouw bedrijf"}</span>
          <button className="ml-auto px-3 py-1.5 rounded-pill text-white text-xs font-medium" style={{ backgroundColor: kleur }}>
            Bekijk offerte
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={next} disabled={saving} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepHuisstijl;