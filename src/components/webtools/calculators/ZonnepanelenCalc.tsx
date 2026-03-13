import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Sun } from "lucide-react";

interface Props {
  primaryColor: string;
  onComplete: (resultaat: Record<string, unknown>) => void;
}

export const ZonnepanelenCalc = ({ primaryColor, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    verbruik: 3500,
    dakOrientatie: "zuid",
    dakType: "schuin",
    aantalPanelen: 10,
  });

  const orientatieFactor: Record<string, number> = { zuid: 1, "oost-west": 0.85, oost: 0.8, west: 0.8, noord: 0.6 };
  const opbrengstPerPaneel = 400; // kWh/jaar
  const prijsPerKWh = 0.40;
  const kostPerPaneel = 350;

  const jaarOpbrengst = Math.round(data.aantalPanelen * opbrengstPerPaneel * (orientatieFactor[data.dakOrientatie] || 1));
  const jaarBesparing = Math.round(Math.min(jaarOpbrengst, data.verbruik) * prijsPerKWh);
  const investering = data.aantalPanelen * kostPerPaneel;
  const terugverdientijd = jaarBesparing > 0 ? (investering / jaarBesparing).toFixed(1) : "–";

  const resultaat = {
    type: "Zonnepanelen",
    aantalPanelen: data.aantalPanelen,
    dakOrientatie: data.dakOrientatie,
    jaarOpbrengst: `${jaarOpbrengst} kWh`,
    jaarBesparing: `€${jaarBesparing}`,
    geschatteInvestering: `€${investering}`,
    terugverdientijd: `${terugverdientijd} jaar`,
  };

  if (step === 0) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Jaarlijks stroomverbruik (kWh)</Label>
          <Input type="number" value={data.verbruik} onChange={(e) => setData({ ...data, verbruik: Number(e.target.value) })} min={0} max={50000} />
        </div>
        <div className="space-y-1.5">
          <Label>Dakoriëntatie</Label>
          <Select value={data.dakOrientatie} onValueChange={(v) => setData({ ...data, dakOrientatie: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="zuid">Zuid</SelectItem>
              <SelectItem value="oost-west">Oost-West</SelectItem>
              <SelectItem value="oost">Oost</SelectItem>
              <SelectItem value="west">West</SelectItem>
              <SelectItem value="noord">Noord</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Aantal zonnepanelen</Label>
          <Input type="number" value={data.aantalPanelen} onChange={(e) => setData({ ...data, aantalPanelen: Number(e.target.value) })} min={1} max={100} />
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
        <Sun className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
        <h3 className="text-lg font-bold">Uw geschatte besparing</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Jaaropbrengst", value: `${jaarOpbrengst} kWh` },
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
