import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Building2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OnboardingPartnerData } from "./useOnboardingState";

interface Props {
  partner: OnboardingPartnerData;
  partnerId: string;
  onSave: (patch: Partial<OnboardingPartnerData>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export const StepOrganisatie = ({ partner, partnerId, onSave, onNext, onPrev }: Props) => {
  const [data, setData] = useState<OnboardingPartnerData>(partner);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof OnboardingPartnerData>(k: K, val: OnboardingPartnerData[K]) =>
    setData(p => ({ ...p, [k]: val }));

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo max 2 MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${partnerId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload mislukt"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
    set("logo_url", publicUrl);
    setUploading(false);
    toast.success("Logo geüpload");
  };

  const handleNext = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Organisatie</h2>
        <p className="text-sm text-muted-foreground mt-1">Deze gegevens verschijnen op je offertes, facturen en in het klantportaal.</p>
      </div>

      <div className="rounded-xl border bg-card p-4 flex gap-4 items-center">
        <div className="h-16 w-32 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden" style={{ background: data.hoofdkleur + "10" }}>
          {data.logo_url ? <img src={data.logo_url} alt="Logo" className="max-h-14 max-w-28 object-contain" /> : <span className="text-xs text-muted-foreground">Geen logo</span>}
        </div>
        <div className="flex-1">
          <Label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploading} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-pill border bg-card hover:bg-muted text-sm">
              <Upload className="h-4 w-4" /> {uploading ? "Uploaden…" : data.logo_url ? "Wijzig logo" : "Logo uploaden"}
            </span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">PNG of SVG, max 2 MB</p>
        </div>
        <div>
          <Label className="text-xs">Hoofdkleur</Label>
          <input type="color" value={data.hoofdkleur} onChange={e => set("hoofdkleur", e.target.value)} className="h-10 w-14 rounded-lg border cursor-pointer mt-1" />
        </div>
      </div>

      <div><Label>Bedrijfsnaam</Label><Input value={data.bedrijfsnaam} onChange={e => set("bedrijfsnaam", e.target.value)} className="rounded-xl mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>KvK-nummer</Label><Input value={data.kvk} onChange={e => set("kvk", e.target.value)} className="rounded-xl mt-1" /></div>
        <div><Label>BTW-nummer</Label><Input value={data.btw_nummer} onChange={e => set("btw_nummer", e.target.value)} className="rounded-xl mt-1" /></div>
      </div>
      <div><Label>Adres</Label><Input value={data.adres} onChange={e => set("adres", e.target.value)} className="rounded-xl mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Postcode</Label><Input value={data.postcode} onChange={e => set("postcode", e.target.value)} className="rounded-xl mt-1" /></div>
        <div><Label>Plaats</Label><Input value={data.plaats} onChange={e => set("plaats", e.target.value)} className="rounded-xl mt-1" /></div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground mb-2">Voorbeeld PDF-header</p>
        <div className="bg-card border rounded-lg p-3 flex items-center justify-between" style={{ borderTop: `4px solid ${data.hoofdkleur}` }}>
          {data.logo_url ? <img src={data.logo_url} alt="" className="h-8" /> : <span className="font-semibold text-sm">{data.bedrijfsnaam || "Jouw organisatie"}</span>}
          <span className="text-[10px] text-muted-foreground">Offerte • {data.plaats}</span>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={handleNext} disabled={saving} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepOrganisatie;