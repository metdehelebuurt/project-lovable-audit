import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sun, Battery, Flame, Car } from "lucide-react";
import type { WizardData } from "./types";

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export default function WizardStepInstallatie({ data, onChange }: Props) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sun className="h-5 w-5 text-primary" />
          Huidige installatie
        </CardTitle>
        <CardDescription>Welke energieoplossingen heeft u al in huis?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Zonnepanelen */}
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Label>Zonnepanelen aanwezig</Label>
            </div>
            <Switch checked={data.heeftZonnepanelen} onCheckedChange={v => onChange({ heeftZonnepanelen: v })} />
          </div>
          {data.heeftZonnepanelen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Totaal vermogen (Wp)</Label>
                <Input
                  type="number"
                  placeholder="bijv. 6000"
                  value={data.zonnepanelenWp || ""}
                  onChange={e => onChange({ zonnepanelenWp: parseInt(e.target.value) || null })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Leeftijd (jaren)</Label>
                <Input
                  type="number"
                  placeholder="bijv. 5"
                  value={data.zonnepanelenLeeftijd || ""}
                  onChange={e => onChange({ zonnepanelenLeeftijd: parseInt(e.target.value) || null })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Type omvormer</Label>
                <Input
                  placeholder="bijv. SolarEdge, Enphase"
                  value={data.omvormerType}
                  onChange={e => onChange({ omvormerType: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Warmtepomp */}
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label>Warmtepomp aanwezig</Label>
              <p className="text-xs text-muted-foreground">Hybride of full-electric</p>
            </div>
          </div>
          <Switch checked={data.heeftWarmtepomp} onCheckedChange={v => onChange({ heeftWarmtepomp: v })} />
        </div>

        {/* Laadpaal */}
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label>Laadpaal aanwezig</Label>
              <p className="text-xs text-muted-foreground">Voor elektrisch rijden</p>
            </div>
          </div>
          <Switch checked={data.heeftLaadpaal} onCheckedChange={v => onChange({ heeftLaadpaal: v })} />
        </div>

        {/* Thuisbatterij */}
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label>Thuisbatterij aanwezig</Label>
              <p className="text-xs text-muted-foreground">Energieopslag</p>
            </div>
          </div>
          <Switch checked={data.heeftThuisbatterij} onCheckedChange={v => onChange({ heeftThuisbatterij: v })} />
        </div>
      </CardContent>
    </Card>
  );
}
