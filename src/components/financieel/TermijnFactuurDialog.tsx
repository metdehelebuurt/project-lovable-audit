import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/types/offerte";
import type { OfferteConversieResult } from "@/lib/factuurFromOfferte";
import { Layers } from "lucide-react";

export type TermijnModus = "volledig" | "aanbetaling" | "restant";

interface Props {
  context: OfferteConversieResult;
  modus: TermijnModus;
  onModusChange: (m: TermijnModus) => void;
  percentage: number;
  onPercentageChange: (p: number) => void;
}

const TermijnFactuurSelector = ({ context, modus, onModusChange, percentage, onPercentageChange }: Props) => {
  const totaal = Number(context.offerte.totaal_bedrag) || 0;
  const aanbetaling = Math.round(totaal * (percentage / 100) * 100) / 100;
  const restant = context.openstaand;

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-muted/20">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4 text-primary" />
          Type factuur
        </div>
        <RadioGroup value={modus} onValueChange={(v) => onModusChange(v as TermijnModus)} className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem value="volledig" id="t-vol" />
            <Label htmlFor="t-vol" className="flex-1 cursor-pointer text-sm">
              <div className="font-medium">Volledig bedrag</div>
              <div className="text-xs text-muted-foreground">Alle regels uit de offerte ({formatCurrency(totaal)} incl. BTW)</div>
            </Label>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem value="aanbetaling" id="t-aan" />
            <Label htmlFor="t-aan" className="flex-1 cursor-pointer text-sm">
              <div className="font-medium flex items-center gap-2">
                Aanbetaling
                {modus === "aanbetaling" && (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={percentage}
                      onChange={(e) => onPercentageChange(Math.max(1, Math.min(99, Number(e.target.value) || 0)))}
                      className="h-7 w-16 text-xs"
                    />
                    <span>%</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {modus === "aanbetaling"
                  ? `Eén regel "Aanbetaling ${percentage}%" — ca. ${formatCurrency(aanbetaling)} excl. BTW`
                  : "Eén regel met percentage van het offertetotaal"}
              </div>
            </Label>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem value="restant" id="t-rest" disabled={context.reedsGefactureerd <= 0} />
            <Label htmlFor="t-rest" className={`flex-1 text-sm ${context.reedsGefactureerd <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
              <div className="font-medium">Restant na eerdere termijnen</div>
              <div className="text-xs text-muted-foreground">
                {context.reedsGefactureerd > 0
                  ? `Resterend openstaand bedrag: ${formatCurrency(restant)}`
                  : "Niet beschikbaar — er is nog niet eerder gefactureerd"}
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default TermijnFactuurSelector;