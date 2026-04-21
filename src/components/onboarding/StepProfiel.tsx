import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OnboardingUserData } from "./useOnboardingState";

interface Props {
  user: OnboardingUserData;
  userId: string;
  email: string;
  onSave: (patch: Partial<OnboardingUserData>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export const StepProfiel = ({ user, userId, email, onSave, onNext, onPrev }: Props) => {
  const [voornaam, setVoornaam] = useState(user.voornaam);
  const [achternaam, setAchternaam] = useState(user.achternaam);
  const [telefoon, setTelefoon] = useState(user.telefoon);
  const [functie, setFunctie] = useState(user.functie);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = `${voornaam[0] || ""}${achternaam[0] || ""}`.toUpperCase() || "?";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload mislukt", { description: error.message }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast.success("Foto geüpload");
  };

  const handleNext = async () => {
    setSaving(true);
    await onSave({ voornaam, achternaam, telefoon, functie, avatar_url: avatarUrl });
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Persoonlijke gegevens</h2>
        <p className="text-sm text-muted-foreground mt-1">Deze gegevens verschijnen in je profiel en op communicatie naar klanten.</p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <Label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-pill border bg-card hover:bg-muted text-sm">
              <Upload className="h-4 w-4" /> {uploading ? "Uploaden…" : avatarUrl ? "Wijzig foto" : "Foto uploaden"}
            </span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">PNG of JPG, max 5 MB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Voornaam</Label><Input value={voornaam} onChange={e => setVoornaam(e.target.value)} className="rounded-xl mt-1" /></div>
        <div><Label>Achternaam</Label><Input value={achternaam} onChange={e => setAchternaam(e.target.value)} className="rounded-xl mt-1" /></div>
      </div>
      <div><Label>E-mailadres</Label><Input value={email} disabled className="rounded-xl mt-1 bg-muted/30" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Telefoon</Label><Input value={telefoon} onChange={e => setTelefoon(e.target.value)} placeholder="06-12345678" className="rounded-xl mt-1" /></div>
        <div><Label>Functie</Label><Input value={functie} onChange={e => setFunctie(e.target.value)} placeholder="bv. Senior adviseur" className="rounded-xl mt-1" /></div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={handleNext} disabled={saving} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepProfiel;