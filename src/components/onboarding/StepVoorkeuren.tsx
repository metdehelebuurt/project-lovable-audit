import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Settings2 } from "lucide-react";
import type { OnboardingUserData, OnboardingVoorkeuren } from "./useOnboardingState";

interface Props {
  user: OnboardingUserData;
  onSave: (patch: Partial<OnboardingUserData>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export const StepVoorkeuren = ({ user, onSave, onNext, onPrev }: Props) => {
  const [v, setV] = useState<OnboardingVoorkeuren>(user.voorkeuren);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof OnboardingVoorkeuren>(k: K, val: OnboardingVoorkeuren[K]) => setV(prev => ({ ...prev, [k]: val }));

  const handleNext = async () => {
    setSaving(true);
    await onSave({ voorkeuren: v });
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> Voorkeuren</h2>
        <p className="text-sm text-muted-foreground mt-1">Pas het platform aan jouw werkwijze aan.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Taal</Label>
          <Select value={v.taal} onValueChange={val => set("taal", val)}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tijdzone</Label>
          <Select value={v.tijdzone} onValueChange={val => set("tijdzone", val)}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Europe/Amsterdam">Europe/Amsterdam</SelectItem>
              <SelectItem value="Europe/Brussels">Europe/Brussels</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Thema</Label>
        <Select value={v.thema} onValueChange={val => set("thema", val as OnboardingVoorkeuren["thema"])}>
          <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="system">Systeem</SelectItem>
            <SelectItem value="light">Licht</SelectItem>
            <SelectItem value="dark">Donker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Notificaties</p>
        <div className="flex items-center justify-between">
          <div><p className="text-sm">E-mail meldingen</p><p className="text-xs text-muted-foreground">Belangrijke updates per e-mail</p></div>
          <Switch checked={!!v.notif_email} onCheckedChange={val => set("notif_email", val)} />
        </div>
        <div className="flex items-center justify-between">
          <div><p className="text-sm">In-app meldingen</p><p className="text-xs text-muted-foreground">Toon notificaties in het platform</p></div>
          <Switch checked={!!v.notif_inapp} onCheckedChange={val => set("notif_inapp", val)} />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={handleNext} disabled={saving} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepVoorkeuren;