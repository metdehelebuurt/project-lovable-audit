import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Thermometer } from "lucide-react";

interface Props {
  primaryColor: string;
  onComplete: (resultaat: Record<string, unknown>) => void;
}

export const WarmtepompCalc = ({ primaryColor, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    oppervlakte: 120,
    woningType: "tussenwoning",
    huidigSysteem: "cv_ketel",
    gasVerbruik: 1500,
  });

  const woningFactor: Record<string, number> = { appartement: 0.7, tussenwoning: 0.85, hoekwoning: 1, vrijstaand: 1.3, tweeonderkap: 1.1 };
  const systeemKosten: Record<string, number> = { cv_ketel: 1800, stadsverwarming: 1200, elektrisch: 2000 };
  const gasPrijs = 1.50;
  const cop = 4.0;
  const stroomPrijs = 0.40;

  const factor = woningFactor[data.woningType] || 1;
  const huidigeKosten = Math.round(data.gasVerbruik * gasPrijs);
  const benodigdeWarmte = data.gasVerbruik * 8.8; // kWh
  const stroomVerbruikWP = Math.round(benodigdeWarmte / cop);
  const nieuweKosten = Math.round(stroomVerbruikWP * stroomPrijs);
  const jaarBesparing = Math.max(0, huidigeKosten - nieuweKosten);
  const investering = Math.round(8000 * factor + (systeemKosten[data.huidigSysteem] || 0));
  const terugverdientijd = jaarBesparing > 0 ? (investering / jaarBesparing).toFixed(1) : "–";

  const resultaat = {
    type: "Warmtepomp",
    oppervlakte: `${data.oppervlakte} m²`,
    woningType: data.woningType,
    jaarBesparing: `€${jaarBesparing}`,
    geschatteInvestering: `€${investering}`,
    terugverdientijd: `${terugverdientijd} jaar`,
  };

  if (step === 0) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Woonoppervlakte (m²)</Label>
          <Input type="number" value={data.oppervlakte} onChange={(e) => setData({ ...data, oppervlakte: Number(e.target.value) })} min={20} max={500} />
        </div>
        <div className="space-y-1.5">
          <Label>Woningtype</Label>
          <Select value={data.woningType} onValueChange={(v) => setData({ ...data, woningType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="appartement">Appartement</SelectItem>
              <SelectItem value="tussenwoning">Tussenwoning</SelectItem>
              <SelectItem value="hoekwoning">Hoekwoning</SelectItem>
              <SelectItem value="tweeonderkap">2-onder-1-kap</SelectItem>
              <SelectItem value="vrijstaand">Vrijstaand</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Huidig verwarmingssysteem</Label>
          <Select value={data.huidigSysteem} onValueChange={(v) => setData({ ...data, huidigSysteem: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cv_ketel">CV-ketel (gas)</SelectItem>
              <SelectItem value="stadsverwarming">Stadsverwarming</SelectItem>
              <SelectItem value="elektrisch">Elektrisch</SelectItem>
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
        <Thermometer className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
        <h3 className="text-lg font-bold">Uw geschatte besparing</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Huidige gaskosten", value: `€${huidigeKosten}/jr` },
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
