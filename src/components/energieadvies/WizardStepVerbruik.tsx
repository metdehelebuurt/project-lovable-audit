import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap, Flame, TrendingUp, Euro, FileText } from "lucide-react";
import type { WizardData } from "./types";

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export default function WizardStepVerbruik({ data, onChange }: Props) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Verbruik & energiecontract
        </CardTitle>
        <CardDescription>Uw huidige energiesituatie helpt ons het advies nauwkeuriger te maken.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              Jaarverbruik elektriciteit (kWh)
            </Label>
            <Input
              type="number"
              placeholder="bijv. 3500"
              value={data.jaarverbruikKwh || ""}
              onChange={e => onChange({ jaarverbruikKwh: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">Staat op uw jaarafrekening</p>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Flame className="h-3.5 w-3.5 text-muted-foreground" />
              Gasverbruik (m³/jaar)
            </Label>
            <Input
              type="number"
              placeholder="bijv. 1500"
              value={data.gasverbruikM3 || ""}
              onChange={e => onChange({ gasverbruikM3: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">0 als u geen gas meer gebruikt</p>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              Teruglevering (kWh/jaar)
            </Label>
            <Input
              type="number"
              placeholder="bijv. 2000"
              value={data.terugleveringKwh || ""}
              onChange={e => onChange({ terugleveringKwh: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">Hoeveel levert u terug aan het net?</p>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Euro className="h-3.5 w-3.5 text-muted-foreground" />
              Maandelijkse energiekosten (€)
            </Label>
            <Input
              type="number"
              placeholder="bijv. 200"
              value={data.maandelijkseKosten || ""}
              onChange={e => onChange({ maandelijkseKosten: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <Label className="flex items-center gap-1.5 mb-3">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Type energiecontract
          </Label>
          <RadioGroup
            value={data.contractType}
            onValueChange={v => onChange({ contractType: v as WizardData["contractType"] })}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="vast" id="vast" />
              <Label htmlFor="vast" className="cursor-pointer">Vast tarief</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="dynamisch" id="dynamisch" />
              <Label htmlFor="dynamisch" className="cursor-pointer">Dynamisch</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-2">Bij een dynamisch contract (bijv. Tibber) kan een batterij extra besparen door slim laden/ontladen.</p>
        </div>
      </CardContent>
    </Card>
  );
}
