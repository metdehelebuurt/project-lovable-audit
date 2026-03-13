import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Home } from "lucide-react";

interface Props {
  primaryColor: string;
  onComplete: (resultaat: Record<string, unknown>) => void;
}

export const IsolatieCalc = ({ primaryColor, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    isolatieType: "dak",
    oppervlakte: 60,
    huidigeSituatie: "niet_geisoleerd",
    gasVerbruik: 1500,
  });

  const besparingPercentage: Record<string, Record<string, number>> = {
    dak: { niet_geisoleerd: 0.20, matig: 0.10 },
    spouw: { niet_geisoleerd: 0.25, matig: 0.12 },
    vloer: { niet_geisoleerd: 0.08, matig: 0.04 },
    glas: { niet_geisoleerd: 0.12, matig: 0.06 },
  };

  const kostPerM2: Record<string, number> = { dak: 45, spouw: 25, vloer: 35, glas: 120 };
  const gasPrijs = 1.50;

  const pct = besparingPercentage[data.isolatieType]?.[data.huidigeSituatie] || 0;
  const jaarBesparing = Math.round(data.gasVerbruik * gasPrijs * pct);
  const investering = Math.round(data.oppervlakte * (kostPerM2[data.isolatieType] || 40));
  const terugverdientijd = jaarBesparing > 0 ? (investering / jaarBesparing).toFixed(1) : "–";

  const labelMap: Record<string, string> = { dak: "Dakisolatie", spouw: "Spouwmuurisolatie", vloer: "Vloerisolatie", glas: "HR++ glas" };

  const resultaat = {
    type: labelMap[data.isolatieType] || "Isolatie",
    oppervlakte: `${data.oppervlakte} m²`,
    jaarBesparing: `€${jaarBesparing}`,
    geschatteInvestering: `€${investering}`,
    terugverdientijd: `${terugverdientijd} jaar`,
  };

  if (step === 0) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Type isolatie</Label>
          <Select value={data.isolatieType} onValueChange={(v) => setData({ ...data, isolatieType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dak">Dakisolatie</SelectItem>
              <SelectItem value="spouw">Spouwmuurisolatie</SelectItem>
              <SelectItem value="vloer">Vloerisolatie</SelectItem>
              <SelectItem value="glas">HR++ glas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Te isoleren oppervlakte (m²)</Label>
          <Input type="number" value={data.oppervlakte} onChange={(e) => setData({ ...data, oppervlakte: Number(e.target.value) })} min={1} max={500} />
        </div>
        <div className="space-y-1.5">
          <Label>Huidige situatie</Label>
          <Select value={data.huidigeSituatie} onValueChange={(v) => setData({ ...data, huidigeSituatie: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="niet_geisoleerd">Niet geïsoleerd</SelectItem>
              <SelectItem value="matig">Matig geïsoleerd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jaarlijks gasverbruik (m³)</Label>
          <Input type="number" value={data.gasVerbruik} onChange={(e) => setData({ ...data, gasVerbruik: Number(e.target.value) })} min={0} max={10000} />
        </div>
        <Button className="w-full rounded-[40px] gap-2" style={{ backgroundColor: primaryColor }} onClick={() => setStep(1)}>
          Bereken besparing <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Home className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
        <h3 className="text-lg font-bold">Uw geschatte besparing</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Type", value: labelMap[data.isolatieType] },
          { label: "Jaarlijkse besparing", value: `€${jaarBesparing}` },
          { label: "Geschatte investering", value: `€${investering}` },
          { label: "Terugverdientijd", value: `${terugverdientijd} jaar` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border p-3 text-center">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold" style={{ color: primaryColor }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="rounded-[40px]" onClick={() => setStep(0)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <Button className="flex-1 rounded-[40px]" style={{ backgroundColor: primaryColor }} onClick={() => onComplete(resultaat)}>
          Vraag offerte aan <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
