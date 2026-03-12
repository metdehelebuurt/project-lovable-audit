import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Heart, Euro, Sun, Battery, Flame, Car, Cpu, Wrench } from "lucide-react";
import type { WizardData, ProductCategorie } from "./types";

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

const categorieen: { value: ProductCategorie; label: string; icon: typeof Sun; beschrijving: string }[] = [
  { value: "zonnepanelen", label: "Zonnepanelen", icon: Sun, beschrijving: "Eigen stroom opwekken" },
  { value: "thuisbatterij", label: "Thuisbatterij", icon: Battery, beschrijving: "Energie opslaan" },
  { value: "warmtepomp", label: "Warmtepomp", icon: Flame, beschrijving: "Verwarmen zonder gas" },
  { value: "laadpaal", label: "Laadpaal", icon: Car, beschrijving: "Elektrisch rijden" },
  { value: "omvormer", label: "Omvormer", icon: Cpu, beschrijving: "Optimaliseer opbrengst" },
  { value: "accessoires", label: "Accessoires", icon: Wrench, beschrijving: "Montage & extra's" },
];

const motivaties: { value: WizardData["motivatie"][number]; label: string }[] = [
  { value: "kostenbesparing", label: "💰 Kosten besparen" },
  { value: "duurzaamheid", label: "🌱 Duurzamer leven" },
  { value: "onafhankelijkheid", label: "⚡ Energieonafhankelijk" },
  { value: "woningwaarde", label: "🏠 Woningwaarde verhogen" },
];

export default function WizardStepWensen({ data, onChange }: Props) {
  const toggleCategorie = (cat: ProductCategorie) => {
    const current = data.interesseCategorieen;
    onChange({
      interesseCategorieen: current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat],
    });
  };

  const toggleMotivatie = (m: WizardData["motivatie"][number]) => {
    const current = data.motivatie;
    onChange({
      motivatie: current.includes(m)
        ? current.filter(x => x !== m)
        : [...current, m],
    });
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-primary" />
          Wensen & budget
        </CardTitle>
        <CardDescription>Waar bent u naar op zoek? Selecteer de categorieën die u interesseren.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categorieën */}
        <div>
          <Label className="mb-3 block font-medium">Waar heeft u interesse in?</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categorieen.map(cat => {
              const selected = data.interesseCategorieen.includes(cat.value);
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategorie(cat.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.beschrijving}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget */}
        <div>
          <Label className="flex items-center gap-1.5 mb-3">
            <Euro className="h-3.5 w-3.5 text-muted-foreground" />
            Indicatie budget (optioneel)
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Minimaal (€)</Label>
              <Input
                type="number"
                placeholder="bijv. 2000"
                value={data.budgetMin || ""}
                onChange={e => onChange({ budgetMin: parseInt(e.target.value) || null })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Maximaal (€)</Label>
              <Input
                type="number"
                placeholder="bijv. 15000"
                value={data.budgetMax || ""}
                onChange={e => onChange({ budgetMax: parseInt(e.target.value) || null })}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Merkvoorkeur */}
        <div>
          <Label className="mb-1.5 block">Merkvoorkeur (optioneel)</Label>
          <Input
            placeholder="bijv. Huawei, Enphase, SolarEdge, Growatt..."
            value={data.merkvoorkeur}
            onChange={e => onChange({ merkvoorkeur: e.target.value })}
            className="rounded-xl"
          />
        </div>

        {/* Motivatie */}
        <div>
          <Label className="mb-3 block font-medium">Wat is uw belangrijkste motivatie?</Label>
          <div className="flex flex-wrap gap-2">
            {motivaties.map(m => {
              const selected = data.motivatie.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMotivatie(m.value)}
                  className={`rounded-full px-4 py-2 text-sm border-2 transition-all ${
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
