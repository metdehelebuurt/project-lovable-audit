import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings2, Save } from "lucide-react";
import {
  LEAD_TYPES,
  LEAD_TYPE_LABEL,
  useOpvolgRegels,
  useUpsertOpvolgRegel,
  type OpvolgLeadType,
  type OpvolgRegel,
} from "@/hooks/affiliate/useOpvolgRegels";

interface RegelForm {
  actief: boolean;
  aantal_herinneringen: number;
  termijnen: string; // comma-separated uren
  escalatie_na_uren: number;
  escalatie_toegestaan: boolean;
  ai_herbereken_na_uren: number;
}

const DEFAULTS: Record<OpvolgLeadType, RegelForm> = {
  demo: { actief: true, aantal_herinneringen: 3, termijnen: "24,72,168", escalatie_na_uren: 24, escalatie_toegestaan: true, ai_herbereken_na_uren: 48 },
  trial: { actief: true, aantal_herinneringen: 4, termijnen: "168,72,24,0", escalatie_na_uren: 24, escalatie_toegestaan: true, ai_herbereken_na_uren: 48 },
  terugbel: { actief: true, aantal_herinneringen: 2, termijnen: "24,2", escalatie_na_uren: 12, escalatie_toegestaan: true, ai_herbereken_na_uren: 72 },
  algemeen: { actief: true, aantal_herinneringen: 2, termijnen: "48,24", escalatie_na_uren: 48, escalatie_toegestaan: false, ai_herbereken_na_uren: 96 },
};

function toForm(r: OpvolgRegel): RegelForm {
  return {
    actief: r.actief,
    aantal_herinneringen: r.aantal_herinneringen,
    termijnen: (r.herinnering_termijnen_uren ?? []).join(","),
    escalatie_na_uren: r.escalatie_na_uren,
    escalatie_toegestaan: r.escalatie_toegestaan,
    ai_herbereken_na_uren: r.ai_herbereken_na_uren,
  };
}

function RegelRij({ type, regel }: { type: OpvolgLeadType; regel?: OpvolgRegel }) {
  const upsert = useUpsertOpvolgRegel();
  const [form, setForm] = useState<RegelForm>(regel ? toForm(regel) : DEFAULTS[type]);

  useEffect(() => {
    setForm(regel ? toForm(regel) : DEFAULTS[type]);
  }, [regel, type]);

  const termijnenArr = useMemo(
    () =>
      form.termijnen
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 0),
    [form.termijnen],
  );

  const opslaan = () => {
    upsert.mutate({
      lead_type: type,
      actief: form.actief,
      aantal_herinneringen: form.aantal_herinneringen,
      herinnering_termijnen_uren: termijnenArr.length > 0 ? termijnenArr : [24],
      escalatie_na_uren: form.escalatie_na_uren,
      escalatie_toegestaan: form.escalatie_toegestaan,
      ai_herbereken_na_uren: form.ai_herbereken_na_uren,
    });
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{LEAD_TYPE_LABEL[type]}</span>
          {!form.actief && <Badge variant="outline">uit</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`actief-${type}`} className="text-xs text-muted-foreground">Actief</Label>
          <Switch id={`actief-${type}`} checked={form.actief} onCheckedChange={(v) => setForm((f) => ({ ...f, actief: v }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Aantal herinneringen</Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={form.aantal_herinneringen}
            onChange={(e) => setForm((f) => ({ ...f, aantal_herinneringen: parseInt(e.target.value || "0", 10) }))}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Termijnen (uren vóór deadline, komma-gescheiden)</Label>
          <Input
            value={form.termijnen}
            onChange={(e) => setForm((f) => ({ ...f, termijnen: e.target.value }))}
            placeholder="24,72,168"
          />
          <p className="text-[11px] text-muted-foreground mt-1">{termijnenArr.length} geldige waarde(n)</p>
        </div>
        <div>
          <Label className="text-xs">AI herbereken (uren)</Label>
          <Input
            type="number"
            min={1}
            value={form.ai_herbereken_na_uren}
            onChange={(e) => setForm((f) => ({ ...f, ai_herbereken_na_uren: parseInt(e.target.value || "1", 10) }))}
          />
        </div>
        <div>
          <Label className="text-xs">Escalatie na (uren te laat)</Label>
          <Input
            type="number"
            min={0}
            value={form.escalatie_na_uren}
            onChange={(e) => setForm((f) => ({ ...f, escalatie_na_uren: parseInt(e.target.value || "0", 10) }))}
          />
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Switch
            id={`esc-${type}`}
            checked={form.escalatie_toegestaan}
            onCheckedChange={(v) => setForm((f) => ({ ...f, escalatie_toegestaan: v }))}
          />
          <Label htmlFor={`esc-${type}`} className="text-xs">Escalatie toegestaan</Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={opslaan} disabled={upsert.isPending}>
          <Save className="h-3.5 w-3.5 mr-1" /> Opslaan
        </Button>
      </div>
    </div>
  );
}

export function OpvolgRegelsKaart() {
  const { data: regels = [], isLoading } = useOpvolgRegels();
  const map = new Map(regels.map((r) => [r.lead_type as OpvolgLeadType, r]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" /> Opvolgregels per lead-type
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Stel zelf in hoeveel herinneringen je krijgt, op welke momenten, en wanneer een achterstallige taak escaleert.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : (
          LEAD_TYPES.map((t) => <RegelRij key={t} type={t} regel={map.get(t)} />)
        )}
      </CardContent>
    </Card>
  );
}