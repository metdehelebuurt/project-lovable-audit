import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface Voorwaarde {
  label: string;
  standaard: boolean;
}

interface BetalingsvoorwaardenConfigProps {
  partnerId: string;
}

const BetalingsvoorwaardenConfig = ({ partnerId }: BetalingsvoorwaardenConfigProps) => {
  const [voorwaarden, setVoorwaarden] = useState<Voorwaarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nieuwLabel, setNieuwLabel] = useState("");

  useEffect(() => {
    supabase
      .from("partners")
      .select("betalingsvoorwaarden_config")
      .eq("id", partnerId)
      .single()
      .then(({ data }) => {
        if (data && Array.isArray((data as any).betalingsvoorwaarden_config)) {
          setVoorwaarden((data as any).betalingsvoorwaarden_config as Voorwaarde[]);
        }
        setLoading(false);
      });
  }, [partnerId]);

  const handleSave = async () => {
    if (voorwaarden.length === 0) {
      toast.error("Voeg minimaal één betaalvoorwaarde toe");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("partners")
      .update({ betalingsvoorwaarden_config: voorwaarden as any })
      .eq("id", partnerId);
    setSaving(false);
    if (error) {
      toast.error("Fout bij opslaan: " + error.message);
      return;
    }
    toast.success("Betaalvoorwaarden opgeslagen");
  };

  const setStandaard = (index: number) => {
    setVoorwaarden(prev =>
      prev.map((v, i) => ({ ...v, standaard: i === index }))
    );
  };

  const verwijder = (index: number) => {
    setVoorwaarden(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the default, make the first one default
      if (updated.length > 0 && !updated.some(v => v.standaard)) {
        updated[0].standaard = true;
      }
      return updated;
    });
  };

  const voegToe = () => {
    const label = nieuwLabel.trim();
    if (!label) return;
    if (voorwaarden.some(v => v.label.toLowerCase() === label.toLowerCase())) {
      toast.error("Deze voorwaarde bestaat al");
      return;
    }
    setVoorwaarden(prev => [...prev, { label, standaard: prev.length === 0 }]);
    setNieuwLabel("");
  };

  if (loading) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Betaalvoorwaarden</CardTitle>
          <p className="text-sm text-muted-foreground">
            Beheer de betaalvoorwaarden die beschikbaar zijn bij offertes en orders
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={String(voorwaarden.findIndex(v => v.standaard))}
          onValueChange={v => setStandaard(Number(v))}
        >
          {voorwaarden.map((vw, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-muted/30"
            >
              <RadioGroupItem value={String(idx)} id={`bv-${idx}`} />
              <Label htmlFor={`bv-${idx}`} className="flex-1 cursor-pointer text-sm">
                {vw.label}
              </Label>
              {vw.standaard && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Standaard
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => verwijder(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </RadioGroup>

        <div className="flex gap-2">
          <Input
            value={nieuwLabel}
            onChange={e => setNieuwLabel(e.target.value)}
            placeholder="Nieuwe betaalvoorwaarde toevoegen..."
            className="rounded-xl"
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), voegToe())}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={voegToe}
            disabled={!nieuwLabel.trim()}
            className="rounded-pill gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Toevoegen
          </Button>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Opslaan..." : "Betaalvoorwaarden opslaan"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BetalingsvoorwaardenConfig;
