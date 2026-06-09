import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, Target, Users, FileText, ClipboardCheck, Wrench, LifeBuoy } from "lucide-react";
import InfoCallout from "./InfoCallout";

interface Doelen {
  modules: string[];
  volume: number;
  primair_doel?: string;
}

interface Props {
  initial: Doelen;
  onSave: (d: Doelen) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

const MODULES = [
  { id: "leads", label: "Leads & CRM", icon: Users, desc: "Inkomende aanvragen en pipeline beheren" },
  { id: "offertes", label: "Offertes", icon: FileText, desc: "Professionele offertes opstellen en versturen" },
  { id: "schouw", label: "Schouwen", icon: ClipboardCheck, desc: "Locatie-inspecties uitvoeren en vastleggen" },
  { id: "installatie", label: "Installaties", icon: Wrench, desc: "Planning en uitvoering door monteurs" },
  { id: "helpdesk", label: "Helpdesk", icon: LifeBuoy, desc: "Service- en supportaanvragen behandelen" },
];

const DOELEN = [
  "Meer leads converteren",
  "Sneller offertes maken",
  "Beter overzicht en planning",
  "Klantcommunicatie centraliseren",
  "Compliance en oplevering vastleggen",
];

export const StepDoelen = ({ initial, onSave, onNext, onPrev }: Props) => {
  const [modules, setModules] = useState<string[]>(initial.modules?.length ? initial.modules : ["leads", "offertes"]);
  const [volume, setVolume] = useState(initial.volume || 25);
  const [doel, setDoel] = useState(initial.primair_doel || DOELEN[0]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => setModules(m => m.includes(id) ? m.filter(x => x !== id) : [...m, id]);

  const next = async () => {
    setSaving(true);
    await onSave({ modules, volume, primair_doel: doel });
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Wat wil je bereiken?</h2>
        <p className="text-sm text-muted-foreground mt-1">We stemmen het platform en de rondleiding af op jouw situatie.</p>
      </div>

      <InfoCallout title="Persoonlijke ervaring">
        Op basis van jouw antwoorden tonen we de relevante modules prominent en passen we de voorbeelddata aan.
      </InfoCallout>

      <div>
        <Label>Welke modules ga je gebruiken? (meerdere mogelijk)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {MODULES.map(m => {
            const Icon = m.icon;
            const sel = modules.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`text-left rounded-xl border p-3 flex gap-3 transition ${sel ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <Icon className={`h-5 w-5 mt-0.5 ${sel ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Wat is je belangrijkste doel?</Label>
        <div className="grid grid-cols-1 gap-1.5 mt-2">
          {DOELEN.map(d => (
            <button
              key={d}
              onClick={() => setDoel(d)}
              className={`text-left text-sm rounded-pill border px-3 py-2 transition ${doel === d ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <Label>Verwacht aantal leads per maand</Label>
          <span className="text-sm font-semibold">{volume}{volume === 200 ? "+" : ""}</span>
        </div>
        <Slider value={[volume]} min={5} max={200} step={5} onValueChange={(v) => setVolume(v[0])} className="mt-3" />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={next} disabled={saving || modules.length === 0} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepDoelen;