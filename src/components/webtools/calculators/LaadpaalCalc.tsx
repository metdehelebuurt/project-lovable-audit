import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Plug } from "lucide-react";

interface Props {
  primaryColor: string;
  onComplete: (resultaat: Record<string, unknown>) => void;
}

export const LaadpaalCalc = ({ primaryColor, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    kmPerJaar: 15000,
    autoType: "elektrisch",
    huidigeEnergie: "benzine",
    thuisLaden: "ja",
  });

  const verbruikPerKm: Record<string, number> = { benzine: 0.12, diesel: 0.10 };
  const brandstofPrijs: Record<string, number> = { benzine: 2.10, diesel: 1.95 };
  const evVerbruik = 0.18; // kWh per km
  const thuisStroomPrijs = 0.35;
  const publiekPrijs = 0.65;
  const laadpaalKosten = 1200;

  const huidigeKosten = data.huidigeEnergie !== "elektrisch"
    ? Math.round(data.kmPerJaar * (verbruikPerKm[data.huidigeEnergie] || 0.11) * (brandstofPrijs[data.huidigeEnergie] || 2.0))
    : 0;

  const stroomPrijs = data.thuisLaden === "ja" ? thuisStroomPrijs : publiekPrijs;
  const evKosten = Math.round(data.kmPerJaar * evVerbruik * stroomPrijs);
  const jaarBesparing = Math.max(0, huidigeKosten - evKosten);
  const terugverdientijd = jaarBesparing > 0 ? (laadpaalKosten / jaarBesparing).toFixed(1) : "–";

  const resultaat = {
    type: "Laadpaal",
    kmPerJaar: data.kmPerJaar,
    jaarBesparing: `€${jaarBesparing}`,
    geschatteInvestering: `€${laadpaalKosten}`,
    terugverdientijd: `${terugverdientijd} jaar`,
  };

  if (step === 0) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Gereden kilometers per jaar</Label>
          <Input type="number" value={data.kmPerJaar} onChange={(e) => setData({ ...data, kmPerJaar: Number(e.target.value) })} min={0} max={100000} />
        </div>
        <div className="space-y-1.5">
          <Label>Huidige brandstof (ter vergelijking)</Label>
          <Select value={data.huidigeEnergie} onValueChange={(v) => setData({ ...data, huidigeEnergie: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="benzine">Benzine</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Kunt u thuis laden?</Label>
          <Select value={data.thuisLaden} onValueChange={(v) => setData({ ...data, thuisLaden: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ja">Ja, thuis laden</SelectItem>
              <SelectItem value="nee">Nee, publiek laden</SelectItem>
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
        <Plug className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
        <h3 className="text-lg font-bold">Uw geschatte besparing</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Huidige brandstofkosten", value: `€${huidigeKosten}/jr` },
          { label: "Jaarlijkse besparing", value: `€${jaarBesparing}` },
          { label: "Laadpaal investering", value: `€${laadpaalKosten}` },
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
