import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Layers } from "lucide-react";

export type HandmatigSubtype = "regulier" | "voorschot" | "eindafrekening";

interface Props {
  subtype: HandmatigSubtype;
  onSubtypeChange: (s: HandmatigSubtype) => void;
  termijnVolgnummer: number;
  onTermijnVolgnummerChange: (n: number) => void;
  termijnTotaal: number;
  onTermijnTotaalChange: (n: number) => void;
  totaalProjectbedrag: number;
  onTotaalProjectbedragChange: (n: number) => void;
}

/**
 * Subtype-keuze voor handmatig aangemaakte verkoopfacturen (zonder offerte-context).
 * Voorschot → krijgt VS-nummering en termijn-context op de PDF.
 * Eindafrekening → toelichting voor manuele verrekenregels.
 */
const HandmatigeVoorschotVelden = ({
  subtype,
  onSubtypeChange,
  termijnVolgnummer,
  onTermijnVolgnummerChange,
  termijnTotaal,
  onTermijnTotaalChange,
  totaalProjectbedrag,
  onTotaalProjectbedragChange,
}: Props) => (
  <Card className="rounded-2xl border-0 shadow-sm bg-muted/20">
    <CardContent className="py-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Layers className="h-4 w-4 text-primary" />
        Type factuur
      </div>

      <RadioGroup
        value={subtype}
        onValueChange={(v) => onSubtypeChange(v as HandmatigSubtype)}
        className="space-y-2"
      >
        <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
          <RadioGroupItem value="regulier" id="hs-reg" className="mt-1" />
          <Label htmlFor="hs-reg" className="flex-1 cursor-pointer text-sm">
            <div className="font-medium">Reguliere factuur</div>
            <div className="text-xs text-muted-foreground">
              Standaard verkoopfactuur — krijgt nummer met prefix VF.
            </div>
          </Label>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
          <RadioGroupItem value="voorschot" id="hs-vs" className="mt-1" />
          <Label htmlFor="hs-vs" className="flex-1 cursor-pointer text-sm space-y-2">
            <div className="font-medium">Voorschotfactuur</div>
            <div className="text-xs text-muted-foreground">
              Krijgt nummer met prefix VS. Optioneel termijn-context tonen op de PDF.
            </div>
            {subtype === "voorschot" && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                  <Label className="text-xs">Termijn nr.</Label>
                  <Input
                    type="number"
                    min={1}
                    value={termijnVolgnummer}
                    onChange={(e) => onTermijnVolgnummerChange(Math.max(1, Number(e.target.value) || 1))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Van totaal</Label>
                  <Input
                    type="number"
                    min={1}
                    value={termijnTotaal}
                    onChange={(e) => onTermijnTotaalChange(Math.max(1, Number(e.target.value) || 1))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Projecttotaal €</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={totaalProjectbedrag}
                    onChange={(e) => onTotaalProjectbedragChange(Math.max(0, Number(e.target.value) || 0))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </Label>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
          <RadioGroupItem value="eindafrekening" id="hs-eind" className="mt-1" />
          <Label htmlFor="hs-eind" className="flex-1 cursor-pointer text-sm space-y-1">
            <div className="font-medium">Eindafrekening</div>
            <div className="text-xs text-muted-foreground">
              Voeg eerder verstuurde voorschotten als negatieve regels toe in het regeloverzicht
              (omschrijving + bedrag negatief). De factuur krijgt prefix VF.
            </div>
          </Label>
        </div>
      </RadioGroup>
    </CardContent>
  </Card>
);

export default HandmatigeVoorschotVelden;