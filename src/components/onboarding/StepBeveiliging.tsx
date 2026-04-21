import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OnboardingUserData } from "./useOnboardingState";

interface Props {
  user: OnboardingUserData;
  onSave: (patch: Partial<OnboardingUserData>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export const StepBeveiliging = ({ user, onSave, onNext, onPrev }: Props) => {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [mfa, setMfa] = useState(user.mfa_enabled);
  const [busy, setBusy] = useState(false);

  const updatePw = async () => {
    if (pw.length < 8) { toast.error("Minimaal 8 tekens"); return; }
    if (pw !== pw2) { toast.error("Wachtwoorden komen niet overeen"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error("Wijzigen mislukt", { description: error.message });
    else { toast.success("Wachtwoord gewijzigd"); setPw(""); setPw2(""); }
  };

  const handleNext = async () => {
    if (mfa !== user.mfa_enabled) await onSave({ mfa_enabled: mfa });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Beveiliging</h2>
        <p className="text-sm text-muted-foreground mt-1">Bescherm je account met een sterk wachtwoord en tweestapsverificatie.</p>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Wachtwoord wijzigen (optioneel)</p>
        <div><Label>Nieuw wachtwoord</Label><Input type="password" value={pw} onChange={e => setPw(e.target.value)} className="rounded-xl mt-1" /></div>
        <div><Label>Bevestig wachtwoord</Label><Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} className="rounded-xl mt-1" /></div>
        <Button onClick={updatePw} disabled={busy || !pw} variant="outline" size="sm" className="rounded-pill">Wachtwoord wijzigen</Button>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Tweestapsverificatie</p>
          <p className="text-xs text-muted-foreground">Extra beveiligingslaag bij inloggen</p>
        </div>
        <Switch checked={mfa} onCheckedChange={setMfa} />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={handleNext} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepBeveiliging;