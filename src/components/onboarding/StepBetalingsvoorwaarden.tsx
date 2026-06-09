import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InfoCallout from "./InfoCallout";

interface Props {
  partnerId: string;
  onNext: () => void;
  onPrev: () => void;
}

const OPTIES = [14, 21, 30, 60];
const DEFAULT_TEKST = "Betaling binnen de afgesproken termijn op het op de factuur vermelde rekeningnummer onder vermelding van het factuurnummer.";

export const StepBetalingsvoorwaarden = ({ partnerId, onNext, onPrev }: Props) => {
  const [termijn, setTermijn] = useState(30);
  const [tekst, setTekst] = useState(DEFAULT_TEKST);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partners")
        .select("betalingsvoorwaarden_config")
        .eq("id", partnerId).maybeSingle();
      const cfg = (data as any)?.betalingsvoorwaarden_config || {};
      if (cfg.termijn_dagen) setTermijn(cfg.termijn_dagen);
      if (cfg.tekst) setTekst(cfg.tekst);
    })();
  }, [partnerId]);

  const next = async () => {
    setSaving(true);
    await supabase.from("partners").update({
      betalingsvoorwaarden_config: { termijn_dagen: termijn, tekst },
    } as any).eq("id", partnerId);
    setSaving(false);
    toast.success("Betalingsvoorwaarden opgeslagen");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Betalingsvoorwaarden</h2>
        <p className="text-sm text-muted-foreground mt-1">Standaard termijn en tekst die op iedere offerte en factuur verschijnt.</p>
      </div>

      <InfoCallout title="Goed om te weten">
        Je kunt deze instellingen per offerte of factuur alsnog handmatig overschrijven.
      </InfoCallout>

      <div>
        <Label>Standaard betalingstermijn</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {OPTIES.map(d => (
            <button key={d} onClick={() => setTermijn(d)}
              className={`px-4 py-2 rounded-pill border text-sm transition ${termijn === d ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"}`}>
              {d} dagen
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Tekst onderaan offertes en facturen</Label>
        <Textarea value={tekst} onChange={e => setTekst(e.target.value)} rows={4} className="rounded-xl mt-1" />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={next} disabled={saving} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StepBetalingsvoorwaarden;