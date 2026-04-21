import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/types/offerte";
import { type OfferteConversieResult, type TermijnModus, getTermijnContext } from "@/lib/factuurFromOfferte";
import { AlertTriangle, Layers } from "lucide-react";

export type { TermijnModus };

interface Props {
  context: OfferteConversieResult;
  modus: TermijnModus;
  onModusChange: (m: TermijnModus) => void;
  percentage: number;
  onPercentageChange: (p: number) => void;
  vastBedrag: number;
  onVastBedragChange: (b: number) => void;
  omschrijving: string;
  onOmschrijvingChange: (o: string) => void;
}

const OMSCHRIJVING_VOORSTELLEN = [
  "Aanbetaling bij opdracht",
  "Termijn bij start installatie",
  "Termijn bij oplevering",
];

const TermijnFactuurSelector = ({
  context,
  modus,
  onModusChange,
  percentage,
  onPercentageChange,
  vastBedrag,
  onVastBedragChange,
  omschrijving,
  onOmschrijvingChange,
}: Props) => {
  const totaal = Number(context.offerte.totaal_bedrag) || 0;
  const subtotaalOfferte = Number(context.offerte.subtotaal) || totaal / 1.21;
  const voorschotInclSchatting = Math.round(totaal * (percentage / 100) * 100) / 100;
  const tCtx = getTermijnContext(context);
  const heeftVoorschotten = context.voorschotten.length > 0;

  // Waarschuwing: zou som > offertetotaal worden?
  const voorschotExclSom = context.voorschotten.reduce((s, v) => s + (v.subtotaal || 0), 0);
  const nieuwExcl = modus === "voorschot_percentage"
    ? subtotaalOfferte * (percentage / 100)
    : modus === "voorschot_bedrag" ? vastBedrag : 0;
  const wordtTeHoog = (voorschotExclSom + nieuwExcl) > subtotaalOfferte * 1.001;

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-muted/20">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="h-4 w-4 text-primary" />
            Type factuur
          </div>
          {heeftVoorschotten && (
            <span className="text-xs text-muted-foreground">
              {context.voorschotten.length} voorschot(ten) eerder verstuurd
            </span>
          )}
        </div>

        <RadioGroup value={modus} onValueChange={(v) => onModusChange(v as TermijnModus)} className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem value="volledig" id="t-vol" />
            <Label htmlFor="t-vol" className="flex-1 cursor-pointer text-sm">
              <div className="font-medium">Volledige factuur</div>
              <div className="text-xs text-muted-foreground">
                Alle regels uit de offerte ({formatCurrency(totaal)} incl. BTW)
              </div>
            </Label>
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem value="voorschot_percentage" id="t-pct" className="mt-1" />
            <Label htmlFor="t-pct" className="flex-1 cursor-pointer text-sm space-y-2">
              <div className="font-medium flex items-center gap-2">
                Voorschotfactuur (percentage)
                {modus === "voorschot_percentage" && (
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
                Termijn {tCtx.volgnummer} van {tCtx.totaal} — ca. {formatCurrency(voorschotInclSchatting)} incl. BTW.
                BTW wordt per tarief gesplitst.
              </div>
            </Label>
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem value="voorschot_bedrag" id="t-bed" className="mt-1" />
            <Label htmlFor="t-bed" className="flex-1 cursor-pointer text-sm space-y-2">
              <div className="font-medium flex items-center gap-2">
                Voorschotfactuur (vast bedrag)
                {modus === "voorschot_bedrag" && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">€</span>
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      value={vastBedrag}
                      onChange={(e) => onVastBedragChange(Math.max(0, Number(e.target.value) || 0))}
                      className="h-7 w-24 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">excl. BTW</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Eén voorschotregel met vast bedrag (BTW van dominant offerte-tarief)
              </div>
            </Label>
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
            <RadioGroupItem
              value="eindafrekening"
              id="t-eind"
              disabled={!heeftVoorschotten}
              className="mt-1"
            />
            <Label
              htmlFor="t-eind"
              className={`flex-1 text-sm space-y-1 ${!heeftVoorschotten ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="font-medium">Eindafrekening (verrekent voorschotten)</div>
              <div className="text-xs text-muted-foreground">
                {heeftVoorschotten
                  ? `Alle offerteregels + automatische verrekening van ${context.voorschotten.length} voorschot(ten) per BTW-tarief`
                  : "Beschikbaar zodra er minimaal 1 voorschotfactuur is verstuurd"}
              </div>
            </Label>
          </div>
        </RadioGroup>

        {(modus === "voorschot_percentage" || modus === "voorschot_bedrag") && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs">Omschrijving op factuur</Label>
            <Input
              value={omschrijving}
              onChange={(e) => onOmschrijvingChange(e.target.value)}
              placeholder="Bijv. Aanbetaling bij opdracht"
              className="h-8 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {OMSCHRIJVING_VOORSTELLEN.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onOmschrijvingChange(s)}
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {wordtTeHoog && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Som van voorschotten overschrijdt offertetotaal</div>
              <div className="text-destructive/80 mt-0.5">
                Reeds gefactureerd: {formatCurrency(voorschotExclSom)} + nieuw: {formatCurrency(nieuwExcl)} &gt; offerte excl: {formatCurrency(subtotaalOfferte)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TermijnFactuurSelector;