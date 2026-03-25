import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Calendar, Compass, Users, Maximize2, Award, Plug, Shield } from "lucide-react";
import type { WizardData } from "./types";

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

const woningTypes = [
  { value: "vrijstaand", label: "Vrijstaand" },
  { value: "twee_onder_een_kap", label: "2-onder-1-kap" },
  { value: "hoekwoning", label: "Hoekwoning" },
  { value: "tussenwoning", label: "Tussenwoning" },
  { value: "appartement", label: "Appartement" },
];

const orientaties = [
  { value: "zuid", label: "Zuid" },
  { value: "oost_west", label: "Oost-West" },
  { value: "oost", label: "Oost" },
  { value: "west", label: "West" },
  { value: "plat", label: "Plat dak" },
  { value: "noord", label: "Noord" },
];

const energielabels = ["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G", "onbekend"];

export default function WizardStepWoning({ data, onChange }: Props) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-5 w-5 text-primary" />
          Woningsituatie
        </CardTitle>
        <CardDescription>Vertel ons over de woning zodat we het juiste advies kunnen geven.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              Type woning
            </Label>
            <Select value={data.woningType} onValueChange={v => onChange({ woningType: v as WizardData["woningType"] })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer type" /></SelectTrigger>
              <SelectContent>
                {woningTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Bouwjaar
            </Label>
            <Input
              type="number"
              placeholder="bijv. 1990"
              value={data.bouwjaar || ""}
              onChange={e => onChange({ bouwjaar: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Compass className="h-3.5 w-3.5 text-muted-foreground" />
              Dakoriëntatie
            </Label>
            <Select value={data.dakOrientatie} onValueChange={v => onChange({ dakOrientatie: v as WizardData["dakOrientatie"] })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer oriëntatie" /></SelectTrigger>
              <SelectContent>
                {orientaties.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              Dakoppervlakte (m²)
            </Label>
            <Input
              type="number"
              placeholder="bijv. 40"
              value={data.dakOppervlakte || ""}
              onChange={e => onChange({ dakOppervlakte: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Aantal personen
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              placeholder="bijv. 4"
              value={data.aantalPersonen || ""}
              onChange={e => onChange({ aantalPersonen: parseInt(e.target.value) || null })}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Award className="h-3.5 w-3.5 text-muted-foreground" />
              Energielabel
            </Label>
            <Select value={data.energielabel} onValueChange={v => onChange({ energielabel: v as WizardData["energielabel"] })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer label" /></SelectTrigger>
              <SelectContent>
                {energielabels.map(l => <SelectItem key={l} value={l}>{l === "onbekend" ? "Onbekend" : l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Plug className="h-3.5 w-3.5 text-muted-foreground" />
              Elektrische aansluiting
            </Label>
            <Select value={data.aansluitwaarde} onValueChange={v => onChange({ aansluitwaarde: v as WizardData["aansluitwaarde"] })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer aansluiting" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-fase">1-fase (standaard)</SelectItem>
                <SelectItem value="3-fase">3-fase (zwaardere aansluiting)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Staat op uw meterkast of energiecontract</p>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Isolatieniveau
            </Label>
            <Select value={data.isolatieNiveau} onValueChange={v => onChange({ isolatieNiveau: v as WizardData["isolatieNiveau"] })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer niveau" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="goed">Goed (dubbel glas, spouwmuur, dak- en vloerisolatie)</SelectItem>
                <SelectItem value="matig">Matig (gedeeltelijk geïsoleerd)</SelectItem>
                <SelectItem value="slecht">Slecht (enkel glas, geen isolatie)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Belangrijk voor warmtepomp-advies</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
