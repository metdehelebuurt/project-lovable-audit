import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Battery } from "lucide-react";

interface Props {
  primaryColor: string;
  onComplete: (resultaat: Record<string, unknown>) => void;
}

const STROOMPRIJS = 0.40;
const TERUGLEVER = 0.07;

export const ThuisbatterijCalc = ({ primaryColor, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    zonnepanelenWp: 5000,
    jaarverbruik: 3500,
    teruglevering: 2000,
    contractType: "vast" as "vast" | "dynamisch",
  });

  // Calculate
  const dagOverschot = data.teruglevering / 365;
  let capaciteit = Math.min(Math.max(Math.ceil(dagOverschot * 1.2), 3), 20);
  if (data.contractType === "dynamisch") {
    capaciteit = Math.min(Math.ceil(capaciteit * 1.3), 20);
  }

  const nuttigOpgeslagen = Math.min(dagOverschot * 0.9, capaciteit * 0.9) * 365;
  let besparingJaar = Math.round(nuttigOpgeslagen * (STROOMPRIJS - TERUGLEVER));
  if (data.contractType === "dynamisch") {
    besparingJaar = Math.round(besparingJaar * 1.15);
  }

  const investering = capaciteit * 500;
  const terugverdientijd = besparingJaar > 0 ? (investering / besparingJaar).toFixed(1) : "–";

  const resultaat = {
    type: "Thuisbatterij",
    aanbevolenCapaciteit: `${capaciteit} kWh`,
    geschatteBesparing: `€${besparingJaar}/jaar`,
    geschatteInvestering: `€${investering}`,
    terugverdientijd: `${terugverdientijd} jaar`,
    contractType: data.contractType,
  };

  if (step === 0) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Vermogen zonnepanelen (Wp)</Label>
          <Input type="number" value={data.zonnepanelenWp} onChange={(e) => setData({ ...data, zonnepanelenWp: Number(e.target.value) })} min={0} max={50000} />
        </div>
        <div className="space-y-1.5">
          <Label>Jaarlijks stroomverbruik (kWh)</Label>
          <Input type="number" value={data.jaarverbruik} onChange={(e) => setData({ ...data, jaarverbruik: Number(e.target.value) })} min={0} max={50000} />
        </div>
        <div className="space-y-1.5">
          <Label>Jaarlijkse teruglevering (kWh)</Label>
          <Input type="number" value={data.teruglevering} onChange={(e) => setData({ ...data, teruglevering: Number(e.target.value) })} min={0} max={50000} />
        </div>
        <div className="space-y-1.5">
          <Label>Type energiecontract</Label>
          <Select value={data.contractType} onValueChange={(v) => setData({ ...data, contractType: v as "vast" | "dynamisch" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vast">Vast tarief</SelectItem>
              <SelectItem value="dynamisch">Dynamisch tarief</SelectItem>
            </SelectContent>
          </Select>
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
        <Battery className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
        <h3 className="text-lg font-bold">Uw thuisbatterij advies</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Aanbevolen capaciteit", value: `${capaciteit} kWh` },
          { label: "Jaarlijkse besparing", value: `€${besparingJaar}` },
          { label: "Geschatte investering", value: `€${investering}` },
          { label: "Terugverdientijd", value: `${terugverdientijd} jaar` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border p-3 text-center">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold" style={{ color: primaryColor }}>{item.value}</p>
          </div>
        ))}
      </div>
      {data.contractType === "dynamisch" && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Met een dynamisch contract profiteert u extra van slim laden bij lage tarieven.
        </p>
      )}
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
