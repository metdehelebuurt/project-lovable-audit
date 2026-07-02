import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck } from "lucide-react";

export interface InkoopLeveringWaarden {
  gewensteLeverdatum: string;
  leverancierReferentie: string;
  contactpersoon: string;
  contactTelefoon: string;
  contactEmail: string;
  adresStraat: string;
  adresPostcode: string;
  adresPlaats: string;
  adresLand: string;
  opmerkingenLeverancier: string;
  interneNotities: string;
}

export const emptyInkoopLevering = (): InkoopLeveringWaarden => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return {
    gewensteLeverdatum: d.toISOString().slice(0, 10),
    leverancierReferentie: "",
    contactpersoon: "",
    contactTelefoon: "",
    contactEmail: "",
    adresStraat: "",
    adresPostcode: "",
    adresPlaats: "",
    adresLand: "NL",
    opmerkingenLeverancier: "",
    interneNotities: "",
  };
};

interface Props {
  waarden: InkoopLeveringWaarden;
  onChange: (patch: Partial<InkoopLeveringWaarden>) => void;
}

export default function InkoopLeveringVelden({ waarden, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" /> Levering & referentie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Gewenste leverdatum</Label>
            <Input
              type="date"
              value={waarden.gewensteLeverdatum}
              onChange={(e) => onChange({ gewensteLeverdatum: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Eigen referentie / PO-nr</Label>
            <Input
              value={waarden.leverancierReferentie}
              onChange={(e) => onChange({ leverancierReferentie: e.target.value })}
              placeholder="bijv. PO-2026-0123"
            />
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs font-semibold">Contactpersoon voor aflevering</Label>
          <div className="grid md:grid-cols-2 gap-2">
            <Input
              value={waarden.contactpersoon}
              onChange={(e) => onChange({ contactpersoon: e.target.value })}
              placeholder="Naam"
            />
            <Input
              value={waarden.contactTelefoon}
              onChange={(e) => onChange({ contactTelefoon: e.target.value })}
              placeholder="Telefoon"
            />
            <Input
              className="md:col-span-2"
              value={waarden.contactEmail}
              onChange={(e) => onChange({ contactEmail: e.target.value })}
              placeholder="E-mail (optioneel)"
              type="email"
            />
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs font-semibold">Afleveradres</Label>
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              className="md:col-span-3"
              value={waarden.adresStraat}
              onChange={(e) => onChange({ adresStraat: e.target.value })}
              placeholder="Straat + huisnr"
            />
            <Input
              value={waarden.adresPostcode}
              onChange={(e) => onChange({ adresPostcode: e.target.value })}
              placeholder="Postcode"
            />
            <Input
              className="md:col-span-2"
              value={waarden.adresPlaats}
              onChange={(e) => onChange({ adresPlaats: e.target.value })}
              placeholder="Plaats"
            />
            <Input
              value={waarden.adresLand}
              onChange={(e) => onChange({ adresLand: e.target.value })}
              placeholder="Land"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 border-t pt-3">
          <div className="space-y-1">
            <Label className="text-xs">Opmerkingen voor leverancier</Label>
            <Textarea
              rows={3}
              value={waarden.opmerkingenLeverancier}
              onChange={(e) => onChange({ opmerkingenLeverancier: e.target.value })}
              placeholder="Komt op de PDF (bv. aflevertijd, kraanwagen, pallet retour)"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Interne notities</Label>
            <Textarea
              rows={3}
              value={waarden.interneNotities}
              onChange={(e) => onChange({ interneNotities: e.target.value })}
              placeholder="Alleen intern zichtbaar"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}